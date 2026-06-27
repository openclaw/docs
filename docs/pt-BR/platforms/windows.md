---
read_when:
    - Instalando o OpenClaw no Windows
    - Escolhendo entre Windows Hub, Windows nativo e WSL2
    - Configurando o aplicativo complementar para Windows ou o modo de nó Windows
summary: 'Compatibilidade com Windows: Windows Hub, CLI e Gateway nativos, configuração do gateway WSL2, modo node e solução de problemas'
title: Windows
x-i18n:
    generated_at: "2026-06-27T17:44:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7c7bde33f27bce6c1136ccf688547ee82750d317a997c4a45b354c52ae1b690
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw inclui um aplicativo complementar nativo **Windows Hub**, além de suporte à CLI do Windows.
Use o Windows Hub quando quiser um aplicativo de desktop com configuração, status na bandeja, chat,
diagnósticos da Central de Comando e recursos de nó do Windows. Use o instalador do PowerShell
quando quiser a CLI/Gateway diretamente. Use WSL2 quando quiser o runtime do Gateway
mais compatível com Linux.

## Recomendado: Windows Hub

O Windows Hub é o aplicativo complementar nativo WinUI para Windows 10 20H2+ e Windows 11. Ele é instalado sem privilégios de administrador e é publicado com instaladores
x64 e ARM64 assinados nas versões do OpenClaw.

Baixe o instalador estável mais recente na [página de versões do OpenClaw](https://github.com/openclaw/openclaw/releases):

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-arm64.exe)
- [Checksums](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-SHA256SUMS.txt)

Se um link de download acima retornar 404, visite a [página de versões](https://github.com/openclaw/openclaw/releases) e procure os ativos `OpenClawCompanion-Setup-*` na versão mais recente.

Depois da instalação, inicie o **OpenClaw Companion** pelo menu Iniciar ou pela bandeja do sistema. O instalador também adiciona atalhos para Configuração do Gateway, Chat, Configurações,
Verificar atualizações e desinstalação.

### O que o Windows Hub inclui

- status na bandeja do sistema e inicialização ao fazer login
- configuração inicial para um Gateway WSL local pertencente ao aplicativo
- configurações de conexão para Gateways locais, remotos e com túnel SSH
- janela de chat nativa e acesso à UI de Controle no navegador
- diagnósticos da Central de Comando para sessões, uso, canais, nós, pareamento e
  comandos de reparo
- modo de nó do Windows para canvas controlado pelo agente, tela, câmera, notificações,
  status do dispositivo, texto para fala, fala para texto e `system.run` controlado
- modo de servidor MCP local para clientes MCP, como Claude Desktop, Claude Code e
  Cursor

### Primeira inicialização

Na primeira inicialização, o Windows Hub abre a configuração quando não há um Gateway salvo utilizável.
O caminho mais rápido é **Configurar localmente**, que provisiona uma distro WSL
`OpenClawGateway` pertencente ao aplicativo, instala o Gateway dentro dela e pareia o aplicativo.
Isso não exporta nem altera sua distro Ubuntu existente.

Escolha **Configuração avançada** ou abra a aba Conexões quando já tiver um
Gateway. Você pode se conectar a:

- um Gateway local neste PC
- um Gateway WSL neste PC
- um Gateway remoto por URL e token ou código de configuração
- um Gateway acessado por um túnel SSH

Quando a configuração terminar, o ícone da bandeja ficará verde. Abra a **Central de Comando** pela
bandeja para confirmar a conexão, o pareamento, o status do nó e a integridade dos canais.

## Modo de nó do Windows

O Windows Hub pode se registrar como um nó OpenClaw de primeira classe. O agente pode então usar
recursos nativos do Windows declarados por meio do Gateway.

Comandos comuns incluem:

- `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`,
  `canvas.snapshot`
- `screen.snapshot` e, com consentimento explícito, `screen.record`
- `camera.list` e, com consentimento explícito, `camera.snap`, `camera.clip`
- `system.notify`, `system.run`, `system.run.prepare`, `system.which`
- `location.get`, `device.info`, `device.status`
- `stt.transcribe`, `tts.speak`

O modo de nó exige pareamento com o Gateway. Se o aplicativo mostrar uma solicitação de pareamento, aprove-a
pelo host do Gateway:

```powershell
openclaw devices list
openclaw devices approve <request-id>
openclaw nodes status
```

O Gateway só encaminha comandos que o nó declara e que a política do servidor
permite. Comandos sensíveis à privacidade, como `screen.record`, `camera.snap` e
`camera.clip`, exigem consentimento explícito em `gateway.nodes.allowCommands`.

## Modo MCP local

O Windows Hub pode expor o mesmo registro de recursos nativos do Windows como um
servidor MCP local em loopback. Isso é útil quando você quer que clientes MCP locais controlem
recursos do Windows sem um Gateway OpenClaw em execução.

Ative-o nas Configurações do Windows Hub, na seção de desenvolvedor/avançada. O aplicativo
mostra o endpoint de loopback e o token bearer depois que o servidor é ativado.

Matriz de modos:

| Modo de nó | Servidor MCP | Comportamento                      |
| ---------- | ------------ | ---------------------------------- |
| desativado | desativado   | Aplicativo de desktop apenas para operador |
| ativado    | desativado   | Nó do Windows conectado ao Gateway |
| desativado | ativado      | Apenas servidor MCP local          |
| ativado    | ativado      | Nó do Gateway mais servidor MCP local |

## CLI e Gateway nativos do Windows

Para uso primeiro pelo terminal, instale o OpenClaw pelo PowerShell:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

Verifique:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

Os fluxos nativos da CLI e do Gateway no Windows têm suporte e continuam melhorando.
A inicialização gerenciada usa Tarefas Agendadas do Windows quando disponível. A tarefa mantém o
script legível `gateway.cmd` no diretório de estado do OpenClaw, mas o inicia por meio
de um wrapper WScript `gateway.vbs` gerado para que o Gateway em segundo plano não abra
uma janela de console visível. Se a criação da tarefa for negada, o OpenClaw recorre a um
item de login na pasta Inicializar por usuário.

Para instalar o serviço do Gateway:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Se você quiser apenas usar a CLI sem um serviço do Gateway gerenciado:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## Gateway WSL2

O WSL2 continua sendo o runtime de Gateway mais compatível com Linux no Windows. O Windows Hub
pode configurar um Gateway WSL pertencente ao aplicativo para você, ou você pode instalar manualmente dentro
da sua própria distro.

Configuração manual:

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Ative o systemd dentro do WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Reinicie o WSL pelo PowerShell:

```powershell
wsl --shutdown
```

Em seguida, instale o OpenClaw dentro do WSL com o início rápido do Linux:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Inicialização automática do Gateway antes do login no Windows

Para configurações WSL sem interface, garanta que a cadeia completa de inicialização seja executada mesmo quando ninguém fizer login
no Windows.

Dentro do WSL:

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

No PowerShell como Administrador:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

Substitua `Ubuntu` pelo nome da sua distro obtido em:

```powershell
wsl --list --verbose
```

> **Observação:** Duas mudanças em relação a receitas mais antigas:
>
> - **`dbus-launch true` em vez de `/bin/true`** — No WSL ≥ 2.6.1.0, uma regressão ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416)) faz a distro encerrar por inatividade 15–20 segundos depois que o último cliente sai, mesmo com linger ativado. `dbus-launch true` mantém um processo filho do init ativo como solução alternativa ([discussão da comunidade, microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
> - **`/ru "$env:USERNAME"` em vez de `/ru SYSTEM`** — Distros WSL por usuário (a configuração padrão) não são visíveis para a conta SYSTEM; a tarefa parece ser executada, mas a distro nunca é iniciada. Executar com sua própria conta evita isso. O Windows solicitará sua senha quando a tarefa for criada.

Depois de reiniciar, verifique pelo WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Expor serviços WSL pela LAN

O WSL tem sua própria rede virtual. Se outra máquina precisar acessar um serviço dentro do
WSL, encaminhe uma porta do Windows para o IP atual do WSL. O IP do WSL pode mudar após
reinicializações, então atualize a regra de encaminhamento quando necessário.

Exemplo no PowerShell como Administrador:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort

New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Observações:

- O SSH de outra máquina aponta para o IP do host Windows, por exemplo
  `ssh user@windows-host -p 2222`.
- Nós remotos devem apontar para uma URL de Gateway acessível, não `127.0.0.1`.
- Use `listenaddress=0.0.0.0` para acesso pela LAN. Use `127.0.0.1` para acesso
  somente local.

## Solução de problemas

### O ícone da bandeja não aparece

Verifique no Gerenciador de Tarefas se `OpenClaw.Tray.WinUI.exe` está em execução. Se estiver, abra a
área de ícones ocultos da bandeja e fixe-o. Se não estiver em execução, inicie o **OpenClaw
Companion** pelo menu Iniciar.

### A configuração local falha

Abra o log de configuração pelo Windows Hub ou inspecione:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

Causas comuns são WSL desativado, virtualização bloqueada, estado WSL pertencente ao aplicativo
obsoleto ou falha de rede ao instalar o pacote do Gateway.

### O aplicativo diz que pareamento é necessário

Aprove a solicitação do operador ou do nó pelo Gateway:

```powershell
openclaw devices list
openclaw devices approve <request-id>
```

Se o dispositivo já tinha um token, reconecte pela aba Conexões depois da
aprovação.

### O chat web não consegue acessar um Gateway remoto

O chat web remoto precisa de HTTPS ou localhost. Para certificados autoassinados, confie
no certificado no Windows ou use um túnel SSH para uma URL localhost.

### `screen.snapshot`, comandos de câmera ou áudio falham

Confirme as permissões do Windows para câmera, microfone, captura de tela e
notificações. Instalações empacotadas declaram os recursos protegidos, mas o Windows
ainda pode solicitar permissão na primeira vez que um comando os usar.

### A conectividade com Git ou GitHub falha

Algumas redes bloqueiam ou limitam HTTPS para o GitHub. Se `git clone` ou `gh auth
login` falhar, tente outra rede, uma VPN ou um proxy HTTP/HTTPS.

Para autenticação `gh` baseada em token na sessão atual:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

Nunca faça commit de tokens nem os cole em issues ou pull requests.

## Relacionado

- [Visão geral de instalação](/pt-BR/install)
- [Configuração do Node.js](/pt-BR/install/node)
- [Nós](/pt-BR/nodes)
- [UI de Controle](/pt-BR/web/control-ui)
- [Configuração do Gateway](/pt-BR/gateway/configuration)
