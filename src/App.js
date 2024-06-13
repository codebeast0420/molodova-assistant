import logo from './logo.svg';
import './App.css';
import OpenAI from 'openai';
import { useEffect, useState } from 'react';
import styles from "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
} from "@chatscope/chat-ui-kit-react";

function App() {
  const [threadId, setThreadId] = useState(null);
  const [stream, setStream] = useState(null);
  const [messages, setMessages] = useState([
    
  ]);
  const [prompt, setPrompt] = useState("");

  const openai = new OpenAI({ apiKey: process.env.REACT_APP_OPENAI_API_KEY, dangerouslyAllowBrowser: true });

  const createThread = async () => {
    const thread = await openai.beta.threads.create();
    setThreadId(thread.id);

  }

  const createMessage = async (prompt) => {
    console.log('prompt', prompt);
    if (prompt === "") return;
    setMessages([...messages, { role: "user", content: prompt }]);
    const message = await openai.beta.threads.messages.create(
      threadId,
      {
        role: "user",
        content: prompt
      }
    );
    console.log(message);
    let run = await openai.beta.threads.runs.createAndPoll(
      threadId,
      {
        assistant_id: process.env.REACT_APP_ASSISTANT_ID,
        // instructions: "Deep Knowledge Group, do you know about this?"
      }
    );
    if (run.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(
        run.thread_id
      );
      // if (Array.isArray(messages.data) && messages.data.length === 0) {
      const history = [];
      for (const message of messages.data.reverse()) {
        console.log(`${message.role} > ${message.content[0].text.value}`);
        // setMessages([...messages, { role: message.role, content: message.content[0].text.value }]);
        history.push({ role: message.role, content: message.content[0].text.value });
      }
      console.log(history);
      setMessages(history);
      // }
    } else {
      console.log(run.status);
    }
  }

  useEffect(() => {
    createThread();
  }, [])

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111928' }}>
      <div style={{ position: "relative", borderRadius: '0.5rem', display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <h1 style={{ textAlign: 'center', color: 'white' }}>Tech and Innovation Ecosystem of Moldova Assistant</h1>
        <MainContainer
        style={{ borderRadius: '0.5rem', padding: '0.5rem', backgroundColor: '#111928', height: "70vh", width: "35vw",}}
        >
          <ChatContainer>
            <MessageList>
              <Message
                model={{
                  message: "Hello, I'm Tech and Innovation Ecosystem of Moldova Assistant. How can I help you today?",
                  sender: 'Tech and Innovation Ecosystem of Moldova Assistant',
                  direction: 'incoming',
                }}
                style={{ marginTop: '10px' }}
              />
              {messages.map((message, index) => (
                <Message
                  key={index}
                  model={{
                    message: message.content,
                    sender: message.role === 'user' ? 'me' : 'Tech and Innovation Ecosystem of Moldova Assistant',
                    direction: message.role === 'user' ? 'outgoing' : 'incoming',
                  }}
                  style={{ marginTop: '10px' }}
                />
              ))}
            </MessageList>
            <MessageInput placeholder="Type message here"
              onChange={(value) => {
                setPrompt(value);
              }}
              onSend={() => {
                createMessage(prompt);
              }}
            />
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  );
}

export default App;
