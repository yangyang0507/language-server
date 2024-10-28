import * as ws from 'ws';
import { JDTLanguageServer } from './jdt-server';
import { createConnection } from 'vscode-languageserver/node';
import {
    ProposedFeatures,
    createConnection as createServerConnection
} from 'vscode-languageserver/node';

export class WebSocketServer {
    private wss: ws.Server;
    private jdtServer: JDTLanguageServer;

    constructor(port: number) {
        console.log(`Initializing WebSocket Server on port ${port}...`);
        this.wss = new ws.Server({ port });
        this.jdtServer = new JDTLanguageServer();
        
        this.wss.on('listening', () => {
            console.log(`WebSocket Server is listening on port ${port}`);
        });

        this.wss.on('error', (error) => {
            console.error('WebSocket Server error:', error);
        });
        
        this.wss.on('connection', this.handleConnection.bind(this));
    }

    private async handleConnection(socket: ws.WebSocket) {
        console.log('New client connected');

        try {
            // 启动 JDT 服务器
            console.log('Starting JDT Language Server for client...');
            const connection = await this.jdtServer.start();
            console.log('JDT Language Server started successfully');

            // 创建 WebSocket 连接
            const reader = {
                listen: (callback: (data: any) => void) => {
                    socket.on('message', (data) => {
                        console.log('Received message from client:', data.toString());
                        callback(data);
                    });
                }
            };

            const writer = {
                write: (data: any) => {
                    console.log('Sending message to client:', data);
                    socket.send(data);
                }
            };

            // 转发消息
            connection.onRequest((method, params) => {
                console.log('Forwarding request to client:', method, params);
                return new Promise((resolve) => {
                    socket.send(JSON.stringify({ method, params }));
                    socket.once('message', (response) => {
                        console.log('Received response from client:', response.toString());
                        resolve(JSON.parse(response.toString()));
                    });
                });
            });

            socket.on('message', (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    console.log('Forwarding request to JDT:', data.method, data.params);
                    connection.sendRequest(data.method, data.params).catch(error => {
                        console.error('Error sending request to JDT:', error);
                    });
                } catch (error) {
                    console.error('Error processing message:', error);
                }
            });

            socket.on('error', (error) => {
                console.error('WebSocket connection error:', error);
            });

            socket.on('close', () => {
                console.log('Client disconnected, disposing JDT server...');
                this.jdtServer.dispose();
            });

        } catch (error) {
            console.error('Error handling connection:', error);
            socket.close();
        }
    }
}
