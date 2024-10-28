import * as path from 'path';
import * as rpc from 'vscode-jsonrpc/node';
import { StreamMessageReader, StreamMessageWriter } from 'vscode-jsonrpc/node';
import { spawn } from 'child_process';
import * as os from 'os';

export class JDTLanguageServer {
    private connection?: rpc.MessageConnection;
    private javaProcess?: ReturnType<typeof spawn>;

    private getConfigPath(): string {
        const platform = process.platform;
        const arch = process.arch;
        
        console.log(`Detecting platform: ${platform} (${arch})`);

        switch (platform) {
            case 'linux':
                if (arch === 'x64') return 'config_linux';
                if (arch === 'arm64') return 'config_linux_aarch64';
                throw new Error(`Unsupported Linux architecture: ${arch}`);
            
            case 'darwin':
                if (arch === 'x64') return 'config_mac';
                if (arch === 'arm64') return 'config_mac_aarch64';
                throw new Error(`Unsupported macOS architecture: ${arch}`);
            
            case 'win32':
                if (arch === 'x64') return 'config_win';
                if (arch === 'arm64') return 'config_win_arm64';
                throw new Error(`Unsupported Windows architecture: ${arch}`);
            
            default:
                throw new Error(`Unsupported platform: ${platform}`);
        }
    }

    async start() {
        console.log('Starting JDT Language Server...');
        
        // JDT LS 路径配置
        const serverPath = path.resolve(__dirname, '../../resources/jdt-language-server-1.40.0-202409261450');
        // 修改为具体的 jar 文件名
        const launcherPath = path.join(serverPath, 'plugins/org.eclipse.equinox.launcher_1.6.900.v20240613-2009.jar');
        const configPath = path.join(serverPath, this.getConfigPath());
        const workspacePath = '/Users/dy/Workspace/jdt-ls-demo';

        console.log('Server configuration:');
        console.log(`- Server path: ${serverPath}`);
        console.log(`- Launcher: ${launcherPath}`);
        console.log(`- Config path: ${configPath}`);
        console.log(`- Workspace: ${workspacePath}`);

        // Java 进程参数
        const javaArgs = [
            // JVM 参数
            '-Declipse.application=org.eclipse.jdt.ls.core.id1',
            '-Dosgi.bundles.defaultStartLevel=4',
            '-Declipse.product=org.eclipse.jdt.ls.core.product',
            '-Dlog.level=ALL',
            '-Xmx1G',
            '--add-modules=ALL-SYSTEM',
            '--add-opens', 'java.base/java.util=ALL-UNNAMED',
            '--add-opens', 'java.base/java.lang=ALL-UNNAMED',
            
            // 启动参数
            '-jar',
            launcherPath,
            '-configuration',
            configPath,
            '-data',
            workspacePath
        ];
        
        console.log('Starting Java process with arguments:', javaArgs.join(' '));
        
        // 启动 Java 进程
        this.javaProcess = spawn('java', javaArgs);

        if (!this.javaProcess.stdout || !this.javaProcess.stdin) {
            throw new Error('Failed to create Java process streams');
        }

        // 错误处理
        this.javaProcess.stderr?.on('data', (data) => {
            console.error(`JDT Error: ${data}`);
        });

        this.javaProcess.stdout?.on('data', (data) => {
            console.log(`JDT Output: ${data}`);
        });

        this.javaProcess.on('error', (error) => {
            console.error('Failed to start JDT process:', error);
            throw error;
        });

        this.javaProcess.on('exit', (code, signal) => {
            console.log(`JDT process exited with code ${code} and signal ${signal}`);
        });
        
        console.log('Creating JSON-RPC connection...');
        
        // 创建 JSON-RPC 连接
        const connection = rpc.createMessageConnection(
            new StreamMessageReader(this.javaProcess.stdout),
            new StreamMessageWriter(this.javaProcess.stdin)
        );

        this.connection = connection;
        
        // 添加连接事件监听
        connection.onError((error) => {
            console.error('JSON-RPC connection error:', error);
        });

        connection.onClose(() => {
            console.log('JSON-RPC connection closed');
        });

        connection.onNotification((method, params) => {
            console.log('Received notification:', method, params);
        });

        console.log('Starting connection listener...');
        connection.listen();
        console.log('JDT Language Server started successfully!');

        return connection;
    }

    dispose() {
        console.log('Disposing JDT Language Server...');
        if (this.connection) {
            this.connection.dispose();
            console.log('JSON-RPC connection disposed');
        }
        if (this.javaProcess) {
            this.javaProcess.kill();
            console.log('Java process terminated');
        }
    }
}
