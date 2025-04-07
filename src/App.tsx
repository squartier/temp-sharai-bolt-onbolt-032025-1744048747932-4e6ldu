import { useEffect, useState, FormEvent } from 'react';
import { Layout } from './components/Layout';
import { supabase } from './lib/supabase';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { Sidebar } from './components/Sidebar';
import { Send, Loader2, Copy, Check, Upload, Workflow as WorkflowIcon, AlertCircle } from 'lucide-react';
import { Routes, Route } from 'react-router-dom';
import { WorkflowList } from './components/WorkflowList';
import { UserManagement } from './components/UserManagement';
import { ProfileSettings } from './components/ProfileSettings';
import { PermissionsManagement } from './components/PermissionsManagement';
import { AuthForm } from './components/AuthForm';
import { testApi } from './lib/api';
import type { WorkflowConfig } from './lib/types';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface MessageDisplay {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isFollowUp?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  workflow_id: string;
}

async function logWorkflowEvent(
  client: SupabaseClient,
  workflowId: string,
  level: 'info' | 'error' | 'warning',
  message: string,
  details?: any
) {
  try {
    const { error } = await client
      .from('workflow_logs')
      .insert({
        workflow_id: workflowId,
        level,
        message,
        details
      });

    if (error) {
      console.error('Failed to log workflow event:', error);
    }
  } catch (err) {
    console.error('Error logging workflow event:', err);
  }
}

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<MessageDisplay[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState('New Chat');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowConfig | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previousAnswer, setPreviousAnswer] = useState<string | null>(null);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  const isInputDisabled = !selectedWorkflow || isProcessing;

  const handleCopy = async (id: string) => {
    try {
      const messageElement = document.querySelector(`[data-message-id="${id}"]`);
      if (messageElement) {
        await navigator.clipboard.writeText(messageElement.textContent || '');
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const formatResponse = (text: string): string => {
    let formattedText = text
      .replace(/<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1[^>]*>(.*?)<\/a>/g, '%%%LINK$1$2$1$3%%%')
      .replace(/<sup\s+class="citation">(.*?)<\/sup>/g, '%%%CITATION$1%%%')
      .replace(/^(#{1,6})\s+(.+)$/gm, (_, level, content) => {
        const size = 7 - level.length;
        return `<h${level.length} class="text-${size}xl font-bold mb-4">${content}</h${level.length}>`;
      })
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
        const sanitizedUrl = url.startsWith('http') ? url : `https://${url}`;
        return `<a href="${sanitizedUrl}" target="_blank" rel="noopener noreferrer" class="text-[#BB86FC] hover:text-[#9B66DC] underline">${text}</a>`;
      })
      .replace(/^\s*[•*-]\s+(.+)$/gm, '<li>$1</li>')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .map(line => line.startsWith('<') ? line : `<p>${line}</p>`)
      .join('\n')
      .replace(/%%%LINK(["'])(.*?)\1(.*?)%%%/g, 
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#BB86FC] hover:text-[#9B66DC] underline">$3</a>')
      .replace(/%%%CITATION(.*?)%%%/g, '<sup class="citation">$1</sup>');

    formattedText = formattedText
      .replace(/(<li>.*<\/li>\n*)+/g, '<ul class="list-disc pl-6 space-y-2 my-4">$&</ul>')
      .replace(/\n{3,}/g, '\n')
      .trim();

    return formattedText;
  };

  useEffect(() => {
    if (!supabase) {
      setSupabaseError('Supabase client not initialized. Please check your environment variables.');
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadConversationMessages(selectedChat);
    }
  }, [selectedChat]);

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: MessageDisplay[] = messages.map(msg => ({
        id: msg.id,
        type: msg.sender_type,
        text: msg.text,
        timestamp: new Date(msg.created_at).toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      }));

      setMessages(formattedMessages);

      const { data: conversation } = await supabase
        .from('conversations')
        .select('title')
        .eq('id', conversationId)
        .single();

      if (conversation) {
        setChatTitle(conversation.title);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load conversation messages');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !selectedFile) return;
    
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    try {
      if (!selectedWorkflow) {
        throw new Error('Please select a workflow first');
      }

      if (!user) {
        throw new Error('You must be logged in to send messages');
      }
      
      let documentUrl = null;
      let uploadStartTime: number | null = null;
      let conversationId = selectedChat;
      
      if (selectedFile) {
        uploadStartTime = Date.now();
        
        const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
        const isImage = fileExt && ['png', 'jpg', 'jpeg', 'gif'].includes(fileExt);
        
        if (isImage && !selectedWorkflow?.supports_images) {
          throw new Error('Image uploads are not supported for this workflow');
        }
        
        if (!isImage && !selectedWorkflow?.supports_documents) {
          throw new Error('Document uploads are not supported for this workflow');
        }
        
        const bucketName = isImage ? 'images' : 'documents';
        const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
        
        // Log the upload attempt
        await logWorkflowEvent(supabase, selectedWorkflow.id, 'info', 'Starting file upload', {
          fileType: isImage ? 'image' : 'document',
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          bucket: bucketName
        });
        
        const { error: uploadError, data } = await supabase.storage
          .from(bucketName)
          .upload(filePath, selectedFile, {
            onUploadProgress: (progress) => {
              setUploadProgress((progress.loaded / progress.total) * 100);
            }
          });

        if (uploadError) throw uploadError;

        const uploadDuration = Date.now() - uploadStartTime;
        
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);
        
        if (!urlData?.publicUrl) {
          throw new Error('Failed to generate public URL for uploaded file');
        }

        documentUrl = urlData.publicUrl;
        
        await logWorkflowEvent(supabase, selectedWorkflow.id, 'info', 'File uploaded successfully', {
          filePath,
          duration: uploadDuration,
          documentUrl,
          fileType: isImage ? 'image' : 'document'
        });

        console.log('Generated file URL:', documentUrl);
      }

      // Create a new conversation if none is selected
      if (!conversationId) {
        const { data: conversation, error: conversationError } = await supabase
          .from('conversations')
          .insert({
            title: message,
            workflow_id: selectedWorkflow.id,
            created_by: user.id
          })
          .select()
          .single();

        if (conversationError) {
          console.error('Failed to create conversation:', {
            error: conversationError,
            workflowId: selectedWorkflow.id,
            userId: user.id
          });
          throw conversationError;
        }

        conversationId = conversation.id;
        setSelectedChat(conversation.id);
        setChatTitle(message);
      }

      // Save user message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'user',
          text: message,
          document_url: documentUrl
        });

      if (messageError) {
        console.error('Failed to insert user message:', {
          error: messageError,
          conversationId,
          userId: user.id
        });
        throw messageError;
      }

      const userMessage: MessageDisplay = {
        id: crypto.randomUUID(),
        type: 'user',
        text: message,
        timestamp: currentTime,
        isFollowUp: !!previousAnswer
      };
    
      setMessage('');
      setMessages(prev => [...prev, userMessage]);
      setIsProcessing(true);

      const response = await testApi({
        workerId: selectedWorkflow.worker_id,
        apiAuthToken: selectedWorkflow.api_auth_token,
        apiConfig: {
          method: 'post',
          url: 'https://api.mindstudio.ai/developer/v2/workers/run',
          content_type: 'application/json'
        },
        variables: {
          request: message,
          workflow: selectedWorkflow.name,
          documentUrl: documentUrl,
          ...(previousAnswer && { previousAnswer })
        }
      });

      if (!response.data || typeof response.data.response !== 'string') {
        throw new Error('Invalid response format from API');
      }

      const formattedText = formatResponse(response.data.response);

      const { error: assistantError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'assistant',
          text: formattedText
        });

      if (assistantError) {
        console.error('Failed to insert assistant message:', {
          error: assistantError,
          conversationId
        });
        await logWorkflowEvent(supabase, selectedWorkflow.id, 'error', 'Failed to save assistant response', { error: assistantError });
        throw assistantError;
      }

      const assistantMessage: MessageDisplay = {
        id: crypto.randomUUID(),
        type: 'assistant',
        text: formattedText,
        timestamp: currentTime
      };

      setMessages(prev => [...prev, assistantMessage]);
      setPreviousAnswer(formattedText);
      
      await logWorkflowEvent(supabase, selectedWorkflow.id, 'info', 'Message exchange completed successfully', {
        conversationId,
        requestLength: message.length,
        responseLength: formattedText.length,
        hadDocument: !!documentUrl,
        isFollowUp: !!previousAnswer
      });
    } catch (error) {
      console.error('Error in message submission:', error);
      const errorMessage: MessageDisplay = {
        id: crypto.randomUUID(),
        type: 'assistant',
        text: error instanceof Error ? error.message : 'An unexpected error occurred',
        timestamp: currentTime
      };
      setMessages(prev => [...prev, errorMessage]);
      
      if (selectedWorkflow) {
        await logWorkflowEvent(supabase, selectedWorkflow.id, 'error', 'Error processing message', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
      toast.error('Failed to process message');
    } finally {
      setIsProcessing(false);
      setSelectedFile(null);
      setUploadProgress(0);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout user={false}>
        <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
          <AuthForm />
        </div>
      </Layout>
    );
  }

  if (supabaseError) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
          <div className="bg-[#1F1F1F] rounded-lg p-8 max-w-md w-full text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold text-white">Connection Error</h2>
            <p className="text-[#757575]">{supabaseError}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onSignOut={handleSignOut} user={true}>
      <Routes>
        <Route path="/workflows" element={<WorkflowList />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/permissions" element={<PermissionsManagement />} />
        <Route path="/profile" element={<ProfileSettings />} />
        <Route
          path="/"
          element={
            <div className="flex h-screen bg-[#121212]">
              <Sidebar
                onNewChat={() => {
                  setMessages([]);
                  setSelectedChat(null);
                  setChatTitle('New Chat');
                  setSelectedWorkflow(null);
                  setPreviousAnswer(null);
                }}
                selectedChat={selectedChat}
                selectedWorkflow={selectedWorkflow}
                onSelectWorkflow={setSelectedWorkflow}
                onSelectChat={setSelectedChat}
              />
              <div className="flex-1 flex flex-col relative">
                <div className="bg-[#1F1F1F] p-4 border-b border-[#2D2D2D] shadow-lg">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[#E0E0E0] text-lg font-medium">{chatTitle}</h2>
                    {selectedWorkflow && (
                      <span className="text-sm text-[#BB86FC]">
                        Using: {selectedWorkflow.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {!selectedWorkflow && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                      <WorkflowIcon className="w-16 h-16 text-[#757575]" />
                      <div className="max-w-md space-y-2">
                        <h3 className="text-xl font-medium text-[#E0E0E0]">Select a Workflow to Start</h3>
                        <p className="text-[#757575]">Choose a workflow from the dropdown menu above to begin your conversation.</p>
                      </div>
                    </div>
                  )}
                  {messages.map((msg) => (
                    <div key={msg.id} className="flex flex-col animate-fade-in">
                      <div className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm text-[#757575]">
                            {msg.type === 'user' 
                              ? msg.isFollowUp 
                                ? 'Your Follow-up' 
                                : 'Your Question' 
                              : "Sharon's Answer"}
                          </span>
                          <button
                            onClick={() => handleCopy(msg.id)}
                            className="text-[#757575] hover:text-[#BB86FC] transition-colors"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <div className={`relative p-4 rounded-2xl shadow-md max-w-2xl w-full ${
                          msg.type === 'user' 
                            ? 'bg-[#BB86FC] text-[#E0E0E0]' 
                            : 'bg-[#2C2C2C] text-[#E0E0E0] prose prose-invert prose-headings:text-[#E0E0E0] prose-a:text-[#BB86FC] prose-a:no-underline hover:prose-a:underline'
                        }`} data-message-id={msg.id}>
                          {msg.type === 'assistant' 
                            ? <div 
                                className="prose prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: msg.text }}
                              />
                            : msg.text
                          }
                        </div>
                        <span className="text-[#757575] text-sm mt-1">
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex flex-col items-start animate-fade-in">
                      <span className="text-sm text-[#757575] mb-1">Sharon's working...</span>
                      <div className="bg-[#2C2C2C] p-4 rounded-2xl shadow-md flex items-center space-x-2 animate-pulse">
                        <Loader2 className="w-5 h-5 text-[#BB86FC] animate-spin" />
                        <span className="text-[#E0E0E0]">Processing your request...</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="sticky bottom-0 p-4 bg-[#121212] border-t border-[#2D2D2D] shadow-lg">
                  <form onSubmit={handleSubmit} className="flex space-x-3">
                    {(selectedWorkflow?.supports_documents || selectedWorkflow?.supports_images) && (
                      <div className={`relative ${isInputDisabled ? 'opacity-50 cursor-not-allowed' : ''}`} title={
                        selectedWorkflow?.supports_documents && selectedWorkflow?.supports_images
                          ? 'Upload documents (.pdf, .doc, .docx, .txt) or images (.png, .jpg, .jpeg, .gif)'
                          : selectedWorkflow?.supports_documents
                            ? 'Upload documents (.pdf, .doc, .docx, .txt)'
                            : 'Upload images (.png, .jpg, .jpeg, .gif)'
                      }>
                        <input
                          type="file"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="hidden"
                          id="file-upload"
                          accept={`${selectedWorkflow?.supports_documents ? '.pdf,.doc,.docx,.txt' : ''}${
                            selectedWorkflow?.supports_documents && selectedWorkflow?.supports_images ? ',' : ''
                          }${selectedWorkflow?.supports_images ? '.png,.jpg,.jpeg,.gif' : ''}`}
                          disabled={isInputDisabled}
                        />
                        <label
                          htmlFor="file-upload"
                          className={`flex items-center justify-center w-12 h-12 rounded-xl transition-colors ${
                            selectedFile ? 'bg-emerald-600' : 'bg-[#2C2C2C]'
                          } ${isInputDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
                        >
                          <Upload className="w-5 h-5 text-white" />
                        </label>
                        {selectedFile && (
                          <div className="absolute bottom-full mb-2 left-0 bg-[#2C2C2C] text-white text-sm rounded-lg p-2 whitespace-nowrap">
                            {selectedFile.name}
                            {uploadProgress > 0 && uploadProgress < 100 && (
                              <div className="w-full h-1 bg-gray-700 rounded-full mt-1">
                                <div
                                  className="h-full bg-emerald-600 rounded-full"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <textarea
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                      value={message}
                      onChange={(e) => {
                        if (!selectedWorkflow) {
                          toast.error('Please select a workflow first');
                          return;
                        }
                        // Adjust textarea height
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                        setMessage(e.target.value);
                      }}
                      placeholder={selectedWorkflow ? "Type your message..." : "Select a workflow to start chatting"}
                      className={`flex-1 bg-[#2C2C2C] text-white px-4 py-3 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#BB86FC] transition-shadow ${
                        isInputDisabled ? 'opacity-50 cursor-not-allowed' : ''
                      } resize-none overflow-hidden min-h-[48px] max-h-[200px]`}
                      disabled={isInputDisabled}
                    ></textarea>
                    <button
                      type="submit"
                      className={`bg-[#BB86FC] text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BB86FC] focus:ring-offset-2 focus:ring-offset-[#121212] transition-all ${
                        isInputDisabled || (!message.trim() && !selectedFile)
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-opacity-90'
                      }`}
                      disabled={isInputDisabled || (!message.trim() && !selectedFile)}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          }
        />
      </Routes>
    </Layout>
  );
}

export default App;