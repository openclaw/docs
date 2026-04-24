---
read_when:
    - Instalar o OpenClaw no Windows
    - Escolher entre Windows nativo e WSL2
    - Procurando o status do app complementar para Windows
summary: 'Suporte a Windows: caminhos de instalação nativos e WSL2, daemon e limitações atuais'
title: Windows
x-i18n:
    generated_at: "2026-04-24T06:02:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc147a9da97ab911ba7529c2170526c50c86711efe6fdf4854e6e0370e4d64ea
    source_path: platforms/windows.md
    workflow: 15
---

O OpenClaw oferece suporte a **Windows nativo** e **WSL2**. O WSL2 é o caminho mais
estável e recomendado para a experiência completa — a CLI, o Gateway e as
ferramentas são executados dentro do Linux com compatibilidade total. O Windows nativo funciona para
uso principal de CLI e Gateway, com algumas limitações observadas abaixo.

Apps complementares nativos para Windows estão planejados.

## WSL2 (recomendado)

- [Primeiros passos](/pt-BR/start/getting-started) (use dentro do WSL)
- [Instalação e atualizações](/pt-BR/install/updating)
- Guia oficial do WSL2 (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Status do Windows nativo

Os fluxos de CLI nativos do Windows estão melhorando, mas o WSL2 ainda é o caminho recomendado.

O que funciona bem no Windows nativo hoje:

- instalador do site via `install.ps1`
- uso local da CLI como `openclaw --version`, `openclaw doctor` e `openclaw plugins list --json`
- smoke local incorporado de agente/provedor, como:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Limitações atuais:

- `openclaw onboard --non-interactive` ainda espera um gateway local alcançável, a menos que você passe `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` e `openclaw gateway install` tentam primeiro Tarefas Agendadas do Windows
- se a criação de Tarefa Agendada for negada, o OpenClaw recua para um item de login na pasta Inicializar por usuário e inicia o gateway imediatamente
- se o próprio `schtasks` travar ou parar de responder, o OpenClaw agora aborta rapidamente esse caminho e faz fallback em vez de travar para sempre
- Tarefas Agendadas ainda são preferidas quando disponíveis porque oferecem melhor status de supervisor

Se você quiser apenas a CLI nativa, sem instalação do serviço gateway, use um destes:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Se você quiser inicialização gerenciada no Windows nativo:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Se a criação da Tarefa Agendada estiver bloqueada, o modo de serviço de fallback ainda iniciará automaticamente após o login por meio da pasta Inicializar do usuário atual.

## Gateway

- [Runbook do Gateway](/pt-BR/gateway)
- [Configuração](/pt-BR/gateway/configuration)

## Instalação do serviço Gateway (CLI)

Dentro do WSL2:

```
openclaw onboard --install-daemon
```

Ou:

```
openclaw gateway install
```

Ou:

```
openclaw configure
```

Selecione **Gateway service** quando solicitado.

Reparar/migrar:

```
openclaw doctor
```

## Inicialização automática do Gateway antes do login no Windows

Para configurações headless, garanta que toda a cadeia de inicialização seja executada mesmo quando ninguém fizer login no
Windows.

### 1) Manter serviços de usuário em execução sem login

Dentro do WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Instalar o serviço de usuário do gateway OpenClaw

Dentro do WSL:

```bash
openclaw gateway install
```

### 3) Iniciar o WSL automaticamente na inicialização do Windows

No PowerShell como Administrador:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

Substitua `Ubuntu` pelo nome da sua distro em:

```powershell
wsl --list --verbose
```

### Verificar a cadeia de inicialização

Após uma reinicialização (antes do login no Windows), verifique a partir do WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Avançado: expor serviços do WSL na LAN (portproxy)

O WSL tem sua própria rede virtual. Se outra máquina precisar alcançar um serviço
em execução **dentro do WSL** (SSH, um servidor TTS local ou o Gateway), você deverá
encaminhar uma porta do Windows para o IP atual do WSL. O IP do WSL muda após reinicializações,
então talvez seja necessário atualizar a regra de encaminhamento.

Exemplo (PowerShell **como Administrador**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Permita a porta no Firewall do Windows (uma vez):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Atualize o portproxy após reinicializações do WSL:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

Observações:

- O SSH de outra máquina aponta para o **IP do host Windows** (exemplo: `ssh user@windows-host -p 2222`).
- Nodes remotos devem apontar para uma URL do Gateway **alcançável** (não `127.0.0.1`); use
  `openclaw status --all` para confirmar.
- Use `listenaddress=0.0.0.0` para acesso pela LAN; `127.0.0.1` o mantém apenas local.
- Se você quiser isso automático, registre uma Tarefa Agendada para executar a etapa
  de atualização no login.

## Instalação passo a passo do WSL2

### 1) Instalar WSL2 + Ubuntu

Abra o PowerShell (Admin):

```powershell
wsl --install
# Ou escolha uma distro explicitamente:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Reinicie se o Windows pedir.

### 2) Ativar systemd (obrigatório para instalação do gateway)

No seu terminal WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Depois, a partir do PowerShell:

```powershell
wsl --shutdown
```

Reabra o Ubuntu e depois verifique:

```bash
systemctl --user status
```

### 3) Instalar o OpenClaw (dentro do WSL)

Para uma configuração inicial normal dentro do WSL, siga o fluxo Linux de Primeiros passos:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

Se você estiver desenvolvendo a partir do código-fonte em vez de fazer onboarding pela primeira vez, use o
loop de desenvolvimento a partir do código-fonte de [Configuração](/pt-BR/start/setup):

```bash
pnpm install
# Apenas na primeira execução (ou após redefinir configuração/workspace local do OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

Guia completo: [Primeiros passos](/pt-BR/start/getting-started)

## App complementar para Windows

Ainda não temos um app complementar para Windows. Contribuições são bem-vindas se você quiser
ajudar a tornar isso realidade.

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Plataformas](/pt-BR/platforms)
