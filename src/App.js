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
  Loader
} from "@chatscope/chat-ui-kit-react";

function App() {
  const [threadId, setThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
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

      const history = [];
      for (const message of messages.data.reverse()) {
        console.log(`${message.role} > ${message.content[0].text.value}`);
        let index = 0;
        const { text } = message.content[0];
        const { annotations } = text;
        const citations = [];
        for (let annotation of annotations) {
          // text.value = text.value.replace(annotation.text, "[" + index + "]");
          text.value = text.value.replace(annotation.text, "");
          const { file_citation } = annotation;
          if (file_citation) {
            const citedFile = await openai.files.retrieve(file_citation.file_id);
            citations.push("[" + index + "]" + citedFile.filename);
          }
          index++;
        }
        history.push({ role: message.role, content: text.value });
        console.log(citations.join("\n"));
      }
      console.log(history);
      setMessages(history);
      // }
    } else {
      console.log(run.status);
    }
    setLoading(false);
  }

  useEffect(() => {
    createThread();
  }, [])

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111928' }}>
      <div style={{ position: "relative", borderRadius: '0.5rem', display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <h1 style={{ textAlign: 'center', color: 'white' }}>Tech and Innovation Ecosystem of Moldova Assistant</h1>
        <MainContainer
          style={{ borderRadius: '0.5rem', padding: '0.5rem', backgroundColor: '#111928', height: "70vh", width: "35vw", }}
        >
          <ChatContainer>
            <MessageList>
              <Message
                model={{
                  message: "Hello, I'm Tech and Innovation Ecosystem of Moldova Assistant. How can I help you today?",
                  sender: 'Tech and Innovation Ecosystem of Moldova Assistant',
                  sentTime: 'Just now',
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
                    sentTime: 'Just now',
                    direction: message.role === 'user' ? 'outgoing' : 'incoming',
                  }}
                  style={{ marginTop: '10px' }}
                />
              ))}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '15px', marginBottom: '15px' }}>
                  <Loader />
                </div>
              )}
            </MessageList>
            <MessageInput placeholder="Type message here"
              onChange={(value) => {
                setPrompt(value);
              }}
              onSend={() => {
                createMessage(prompt);
              }}
              disabled={loading}
            />
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  );
}

export default App;
