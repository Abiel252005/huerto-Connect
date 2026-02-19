import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  CHAT_CONVERSATIONS_MOCK,
  CHAT_METRICS_MOCK,
  ChatConversation,
  ChatMetric
} from '../mock/chatbot.mock';

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  getMetricas(): Observable<ChatMetric[]> {
    return of(CHAT_METRICS_MOCK).pipe(delay(140));
  }

  getConversaciones(): Observable<ChatConversation[]> {
    return of(CHAT_CONVERSATIONS_MOCK).pipe(delay(140));
  }
}
