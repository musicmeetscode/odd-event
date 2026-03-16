import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async

class QuestionConsumer(AsyncWebsocketConsumer):
    # This method is called when the WebSocket connects
    async def connect(self):
        # Determine the group name for this session's Q&A feed
        # We assume the URL path will contain a session ID (e.g., /ws/session/1/)
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.session_group_name = f'session_{self.session_id}'

        # Join the session's group. All users interested in this session's Q&A will join this group.
        await self.channel_layer.group_add(
            self.session_group_name,
            self.channel_name
        )

        await self.accept()

    # This method is called when the WebSocket disconnects
    async def disconnect(self, close_code):
        # Leave the session's group
        await self.channel_layer.group_discard(
            self.session_group_name,
            self.channel_name
        )

    # Receive message from WebSocket (usually not needed for Q&A broadcast)
    async def receive(self, text_data):
        pass # We only broadcast data from the REST API, not receive data here

    # --- Group Send Handler ---
    # This custom method is called when a message is sent to the group via channel_layer.group_send()
    async def new_question(self, event):
        question_data = event['data']

        # Send the data over the WebSocket to the client
        await self.send(text_data=json.dumps({
            'type': 'new_question',
            'data': question_data
        }))

    # --- Group Send Handler for ANSWERED Questions ---
    async def question_answered(self, event):
        answer_data = event['data']
        await self.send(text_data=json.dumps({
            'type': 'question_answered', # Frontend receives this type
            'data': answer_data
        }))
