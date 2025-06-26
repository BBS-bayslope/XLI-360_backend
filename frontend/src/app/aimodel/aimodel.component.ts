// src/app/aimodel/aimodel.component.ts
import { Component, NgModule, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarkdownModule, MARKED_OPTIONS, MarkedOptions } from 'ngx-markdown';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from '../services/api.service';
import { BrowserModule } from '@angular/platform-browser';
// import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'app-aimodel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MarkdownModule, // Add forRoot() to provide Markdown dependencies
    HttpClientModule,
  ],
  providers: [
    // Optional: Customize MarkedOptions if needed
    {
      provide: MARKED_OPTIONS,
      useValue: {
        gfm: true, // GitHub Flavored Markdown
        breaks: true, // Support line breaks
      },
    },
  ],
  templateUrl: './aimodel.component.html',
  styleUrls: ['./aimodel.component.scss'],
})
export class AimodelComponent implements OnInit {
  messages: { sender: string; text: string }[] = [];
  userInput: string = '';
  provider: 'openrouter' = 'openrouter'; // Fixed to OpenRouter for DeepSeek R1
  isLoading: boolean = false;
  isLoggedIn: boolean = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.isLoggedIn = !!localStorage.getItem('access');
    if (!this.isLoggedIn) {
      this.messages.push({
        sender: 'XLi Chatbox',
        text: 'Please log in to use the chatbot.',
      });
    }
  }

  sendMessage() {
    const message = this.userInput.trim();
    if (!message) {
      this.messages.push({
        sender: 'XLi Chatbox',
        text: 'Please enter a message.',
      });
      return;
    }

    this.messages.push({ sender: 'You', text: message });
    this.userInput = '';
    this.isLoading = true;

    this.apiService.chat(message, this.provider).subscribe({
      next: (res) => {
        this.isLoading = false;
        const reply =
          typeof res.response === 'string'
            ? res.response
            : JSON.stringify(res.response, null, 2);
        this.messages.push({ sender: 'XLi Chatbox', text: reply });
        setTimeout(() => {
          const chatWindow = document.querySelector('.chat-window');
          if (chatWindow) {
            chatWindow.scrollTop = chatWindow.scrollHeight;
          }
        }, 0);
      },
      error: (err) => {
        this.isLoading = false;
        let errorMessage = 'Error: Could not connect to server.';
        if (err.status === 401) {
          this.isLoggedIn = false;
          errorMessage = 'Please log in to use the chatbot.';
        } else if (err.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        } else if (err.error && err.error.error) {
          errorMessage = `Error: ${err.error.error}`;
        }
        this.messages.push({ sender: 'XLi Chatbox', text: errorMessage });
      },
    });
  }
}
