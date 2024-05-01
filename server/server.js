const {VertexAI} = require('@google-cloud/vertexai');

// Initialize Vertex with your Cloud project and location
const vertex_ai = new VertexAI({project: 'trygcp-ai-2', location: 'us-central1'});
const model = 'gemini-1.5-pro-preview-0409';

const express = require('express');
const marked = require('marked');
const app = express();
app.use(express.json())
const port = 8080;
const path = require('path');


// Chat implementation
app.post('/chat', async (req, res) => {
  console.log(req.body);
  try {
    const chatResponse = await sendMessage(req.body.message);
    const parsedResponse = marked.parse(chatResponse);
    res.status(200).send({
      message: parsedResponse,
    });
  } catch (e) {
    console.error(e);
    res.status(500).send('Internal Server Error');
  }
});

// Instantiate the models
const generativeModel = vertex_ai.preview.getGenerativeModel({
  model: model,
  generationConfig: {
    'maxOutputTokens': 8192,
    'temperature': 1,
    'topP': 0.95,
  },
  safetySettings: [
    {
        'category': 'HARM_CATEGORY_HATE_SPEECH',
        'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
        'category': 'HARM_CATEGORY_DANGEROUS_CONTENT',
        'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
        'category': 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
        'category': 'HARM_CATEGORY_HARASSMENT',
        'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
    }
  ],
});

const chat = generativeModel.startChat({});

async function sendMessage(message) {
  const result = await chat.sendMessageStream([
    {text: message}
  ]);
  let output = '';
  for await (const item of result.stream) {
    const text = item.candidates[0].content.parts[0].text;
    output = `${output}${text}`;
  }

  return output;
}


// HTML Content
app.use(express.static(path.join(__dirname, '../dist/chat-with-gemini/browser')));

app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, '../dist/chat-with-gemini/browser/index.html'));
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});