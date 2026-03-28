import json
from channels.generic.websocket import AsyncWebsocketConsumer


class QuestionConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for live Q&A within sessions (kept from original)."""

    async def connect(self):
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.session_group_name = f'session_{self.session_id}'

        await self.channel_layer.group_add(
            self.session_group_name,
            self.channel_name,
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.session_group_name,
            self.channel_name,
        )

    async def receive(self, text_data):
        pass

    async def new_question(self, event):
        await self.send(text_data=json.dumps({
            'type': 'new_question',
            'data': event['data'],
        }))

    async def question_answered(self, event):
        await self.send(text_data=json.dumps({
            'type': 'question_answered',
            'data': event['data'],
        }))


class LeaderboardConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for live leaderboard updates."""

    async def connect(self):
        self.event_id = self.scope['url_route']['kwargs']['event_id']
        self.event_group_name = f'event_{self.event_id}'

        await self.channel_layer.group_add(
            self.event_group_name,
            self.channel_name,
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.event_group_name,
            self.channel_name,
        )

    async def receive(self, text_data):
        pass

    async def leaderboard_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'leaderboard_update',
            'data': event['data'],
        }))
