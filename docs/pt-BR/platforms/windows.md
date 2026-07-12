---
read_when:
    - Instalando o OpenClaw no Windows
    - Escolhendo entre o Windows Hub, o Windows nativo e o WSL2
    - Configurando o aplicativo complementar para Windows ou o modo Node do Windows
summary: 'Suporte ao Windows: Hub do Windows, CLI e Gateway nativos, configuração do Gateway no WSL2, modo Node e solução de problemas'
title: Windows
x-i18n:
    generated_at: "2026-07-12T15:27:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f1a756d3af3898f211c27c34e16bbcc08f71e214ca1e0d5680c15a091ae1c2ca
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw inclui um aplicativo complementar nativo **Windows Hub**, além de suporte à CLI no Windows.
Use o Windows Hub para ter um aplicativo de desktop com configuração, status na bandeja, chat, diagnósticos da Central de Comando e recursos de Node do Windows. Use o instalador do PowerShell diretamente para a CLI/Gateway. Use o WSL2 para obter o runtime do Gateway com maior compatibilidade com Linux.

## Recomendado: Windows Hub

O Windows Hub é o aplicativo complementar WinUI nativo para Windows 10 20H2+ e Windows 11. Ele é instalado sem privilégios de administrador e disponibiliza instaladores x64 e ARM64 assinados em sua própria página de lançamentos.

O Windows Hub é publicado independentemente da CLI e do Gateway do OpenClaw. Baixe o instalador estável mais recente do Hub na [página de lançamentos do Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases/latest) ou diretamente por meio de `releases/latest/download`:

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-arm64.exe)

Se um dos links acima retornar 404, acesse a [página de lançamentos do Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases) e abra o lançamento estável mais recente do Windows Hub. Os lançamentos estáveis regulares do OpenClaw também espelham uma compilação do Windows Hub fixada e validada para o lançamento; esse espelho pode estar defasado em relação a um lançamento independente mais recente do Hub.

Após a instalação, inicie **OpenClaw Companion** pelo menu Iniciar ou pela bandeja do sistema. O instalador também adiciona atalhos para configuração do Gateway, chat, configurações, verificação de atualizações e desinstalação.

### O que o Windows Hub inclui

- Status na bandeja do sistema e inicialização ao entrar na conta.
- Configuração inicial de um Gateway WSL local gerenciado pelo aplicativo.
- Configurações de conexão para Gateways locais, remotos e com túnel SSH.
- Janela de chat nativa, além de acesso à Control UI no navegador.
- Diagnósticos da Central de Comando para sessões, uso, canais, Nodes, pareamento e comandos de reparo.
- Modo de Node do Windows para canvas, tela, câmera, notificações, status do dispositivo, fala e `system.run` controlado pelo agente.
- Modo de servidor MCP local para clientes MCP como Claude Desktop, Claude Code e Cursor.

### Primeira inicialização

Na primeira inicialização, o Windows Hub abre a configuração quando não há um Gateway salvo que possa ser usado. O caminho mais rápido é **Configurar localmente**, que provisiona uma distro WSL `OpenClawGateway` gerenciada pelo aplicativo, instala o Gateway dentro dela e pareia o aplicativo. Isso não exporta nem modifica sua distro Ubuntu existente.

Escolha **Configuração avançada** ou abra a guia Conexões quando você já tiver um Gateway. Você pode se conectar a:

- um Gateway local neste PC
- um Gateway WSL neste PC
- um Gateway remoto por URL e token ou código de configuração
- um Gateway acessado por meio de um túnel SSH

Quando a configuração é concluída, o ícone da bandeja fica verde. Abra a **Central de Comando** pela bandeja para confirmar a conexão, o pareamento, o status do Node e a integridade dos canais.

## Modo de Node do Windows

O Windows Hub pode se registrar como um Node do OpenClaw para que o agente possa usar recursos nativos do Windows declarados por meio do Gateway. Os comandos do Node devem ser declarados pelo Node e permitidos pela política do Gateway antes de serem executados; consulte [Nodes](/pt-BR/nodes#command-policy) para ver o modelo completo de permissão e negação.

Comandos comuns:

| Família | Comandos                                                                             |
| ------ | ------------------------------------------------------------------------------------ |
| Canvas | `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot` |
| Tela | `screen.snapshot`; `screen.record` exige aceitação explícita                          |
| Câmera | `camera.list`; `camera.snap`, `camera.clip` exigem aceitação explícita                  |
| Sistema | `system.notify`, `system.run`, `system.run.prepare`, `system.which`                  |
| Dispositivo | `location.get`, `device.info`, `device.status`                                       |
| Fala   | `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`, `talk.speak`  |

O modo de Node exige pareamento com o Gateway. Se o aplicativo exibir uma solicitação de pareamento, aprove-a no host do Gateway:

```powershell
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

O Gateway encaminha apenas os comandos declarados pelo Node e permitidos pela política do servidor. Comandos que afetam a privacidade, como `screen.record`, `camera.snap` e `camera.clip`, exigem aceitação explícita em `gateway.nodes.allowCommands`.

## Modo MCP local

O Windows Hub pode expor o mesmo registro de recursos nativos do Windows como um servidor MCP local em loopback, permitindo que clientes MCP locais controlem recursos do Windows sem um Gateway do OpenClaw em execução.

Ative-o nas configurações do Windows Hub, na seção de desenvolvedor/avançada. O aplicativo mostra o endpoint de loopback e o token bearer após o servidor ser ativado.

Matriz de modos:

| Modo de Node | Servidor MCP | Comportamento                           |
| --------- | ---------- | ---------------------------------- |
| desativado       | desativado        | Aplicativo de desktop somente para o operador          |
| ativado        | desativado        | Node do Windows conectado ao Gateway     |
| desativado       | ativado         | Somente servidor MCP local              |
| ativado        | ativado         | Node do Gateway mais servidor MCP local |

## CLI e Gateway nativos do Windows

Para uso prioritariamente pelo terminal, instale o OpenClaw pelo PowerShell:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

Verifique:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

A inicialização gerenciada usa as Tarefas Agendadas do Windows quando disponíveis. A tarefa mantém o script legível `gateway.cmd` no diretório de estado do OpenClaw, mas o inicia por meio de um wrapper WScript `gateway.vbs` gerado, para que o Gateway em segundo plano não abra uma janela visível do console. Se a criação da tarefa for negada, o OpenClaw recorre a um item de inicialização por usuário na pasta Inicializar.

Instale o serviço do Gateway:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Para uso somente da CLI sem um serviço gerenciado do Gateway:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## Gateway WSL2

O WSL2 continua sendo o runtime do Gateway com maior compatibilidade com Linux no Windows. O Windows Hub pode configurar para você um Gateway WSL gerenciado pelo aplicativo, ou você pode instalá-lo manualmente dentro de sua própria distro.

Configuração manual:

```powershell
wsl --install
# Ou escolha explicitamente uma distro:
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

Em seguida, instale o OpenClaw dentro do WSL usando o início rápido para Linux:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Inicialização automática do Gateway antes do login no Windows

Para configurações WSL sem interface gráfica, certifique-se de que toda a cadeia de inicialização seja executada mesmo quando ninguém entrar no Windows.

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

<Note>
Duas alterações em relação às instruções antigas:

- **`dbus-launch true` em vez de `/bin/true`**: no WSL >= 2.6.1.0, uma regressão ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416)) encerra a distro por inatividade 15-20 segundos após o último cliente sair, mesmo com a permanência ativada. `dbus-launch true` mantém ativo um processo filho do init como solução alternativa (discussão da comunidade, [microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
- **`/ru "$env:USERNAME"` em vez de `/ru SYSTEM`**: as distros WSL por usuário (a configuração padrão) não ficam visíveis para a conta SYSTEM; portanto, a tarefa parece ser executada, mas a distro nunca é iniciada. Executá-la com sua própria conta evita isso; o Windows solicita sua senha quando a tarefa é criada.

</Note>

Após reiniciar, verifique pelo WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Expor serviços WSL pela LAN

O WSL tem sua própria rede virtual. Se outra máquina precisar acessar um serviço dentro do WSL, encaminhe uma porta do Windows para o IP atual do WSL. O IP do WSL pode mudar após reinicializações; portanto, atualize a regra de encaminhamento quando necessário.

Exemplo no PowerShell como Administrador:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "IP do WSL não encontrado." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort

New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Observações:

- O SSH de outra máquina deve apontar para o IP do host Windows, por exemplo, `ssh user@windows-host -p 2222`.
- Nodes remotos devem apontar para uma URL acessível do Gateway, não para `127.0.0.1`.
- Use `listenaddress=0.0.0.0` para acesso pela LAN e `127.0.0.1` para acesso somente local.

## Solução de problemas

### O ícone da bandeja não aparece

Verifique o Gerenciador de Tarefas em busca de `OpenClaw.Tray.WinUI.exe`. Se ele estiver em execução, abra a área de ícones ocultos da bandeja e fixe-o. Caso contrário, inicie **OpenClaw Companion** pelo menu Iniciar.

### A configuração local falha

Abra o log de configuração pelo Windows Hub ou examine:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

Causas comuns: WSL desativado, virtualização bloqueada, estado desatualizado do WSL gerenciado pelo aplicativo ou falha de rede durante a instalação do pacote do Gateway.

### O aplicativo informa que o pareamento é necessário

Aprove a solicitação do operador ou do Node no Gateway:

```powershell
openclaw devices list
openclaw devices approve <requestId>
```

Se o dispositivo já tinha um token, reconecte-o pela guia Conexões após a aprovação.

### O chat da Web não consegue acessar um Gateway remoto

O chat remoto da Web exige HTTPS ou localhost. Para certificados autoassinados, confie no certificado no Windows ou use um túnel SSH para uma URL de localhost.

### Os comandos `screen.snapshot`, de câmera ou de áudio falham

Confirme as permissões do Windows para câmera, microfone, captura de tela e notificações. As instalações empacotadas declaram os recursos protegidos, mas o Windows ainda pode solicitar permissão na primeira vez que um comando os utilizar.

### A conectividade com o Git ou GitHub falha

Algumas redes bloqueiam ou limitam o HTTPS para o GitHub. Se `git clone` ou `gh auth login` falhar, tente outra rede, uma VPN ou um proxy HTTP/HTTPS.

Para autenticação do `gh` baseada em token na sessão atual:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

Nunca faça commit de tokens nem os cole em issues ou pull requests.

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Configuração do Node.js](/pt-BR/install/node)
- [Nodes](/pt-BR/nodes)
- [Control UI](/pt-BR/web/control-ui)
- [Configuração do Gateway](/pt-BR/gateway/configuration)
