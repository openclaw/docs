---
read_when:
    - Configuração de uma nova máquina
    - Você quer “o mais recente e melhor” sem quebrar sua configuração pessoal
summary: Configuração avançada e fluxos de trabalho de desenvolvimento para OpenClaw
title: Configuração
x-i18n:
    generated_at: "2026-04-30T10:09:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: f96e5e8d46e694f0dfc67eeeb34f4c49498a56e384c3a2a6266c2214afdc0870
    source_path: start/setup.md
    workflow: 16
---

<Note>
Se você estiver configurando pela primeira vez, comece com [Introdução](/pt-BR/start/getting-started).
Para detalhes de onboarding, consulte [Onboarding (CLI)](/pt-BR/start/wizard).
</Note>

## TL;DR

Escolha um fluxo de configuração com base na frequência com que você quer atualizações e se quer executar o Gateway por conta própria:

- **A personalização fica fora do repo:** mantenha sua configuração e workspace em `~/.openclaw/openclaw.json` e `~/.openclaw/workspace/` para que as atualizações do repo não os afetem.
- **Fluxo estável (recomendado para a maioria):** instale o aplicativo para macOS e deixe-o executar o Gateway incluído.
- **Fluxo de ponta (dev):** execute o Gateway por conta própria via `pnpm gateway:watch` e depois deixe o aplicativo para macOS se conectar no modo Local.

## Pré-requisitos (a partir do código-fonte)

- Node 24 recomendado (Node 22 LTS, atualmente `22.14+`, ainda compatível)
- `pnpm` preferido (ou Bun se você usar intencionalmente o [fluxo Bun](/pt-BR/install/bun))
- Docker (opcional; apenas para configuração em contêiner/e2e — consulte [Docker](/pt-BR/install/docker))

## Estratégia de personalização (para que as atualizações não atrapalhem)

Se você quer algo “100% personalizado para mim” _e_ atualizações fáceis, mantenha sua personalização em:

- **Configuração:** `~/.openclaw/openclaw.json` (JSON/JSON5-ish)
- **Workspace:** `~/.openclaw/workspace` (Skills, prompts, memórias; transforme-o em um repo git privado)

Faça o bootstrap uma vez:

```bash
openclaw setup
```

De dentro deste repo, use a entrada da CLI local:

```bash
openclaw setup
```

Se você ainda não tiver uma instalação global, execute via `pnpm openclaw setup` (ou `bun run openclaw setup` se estiver usando o fluxo Bun).

## Executar o Gateway a partir deste repo

Depois de `pnpm build`, você pode executar a CLI empacotada diretamente:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Fluxo estável (aplicativo para macOS primeiro)

1. Instale e inicie **OpenClaw.app** (barra de menus).
2. Conclua a checklist de onboarding/permissões (prompts de TCC).
3. Garanta que o Gateway esteja em **Local** e em execução (o aplicativo o gerencia).
4. Vincule superfícies (exemplo: WhatsApp):

```bash
openclaw channels login
```

5. Verificação de sanidade:

```bash
openclaw health
```

Se o onboarding não estiver disponível no seu build:

- Execute `openclaw setup`, depois `openclaw channels login` e então inicie o Gateway manualmente (`openclaw gateway`).

## Fluxo de ponta (Gateway em um terminal)

Objetivo: trabalhar no Gateway em TypeScript, obter hot reload e manter a UI do aplicativo para macOS conectada.

### 0) (Opcional) Executar também o aplicativo para macOS a partir do código-fonte

Se você também quiser o aplicativo para macOS no fluxo de ponta:

```bash
./scripts/restart-mac.sh
```

### 1) Iniciar o Gateway de desenvolvimento

```bash
pnpm install
# Apenas na primeira execução (ou após redefinir a configuração/workspace local do OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` inicia ou reinicia o processo de watch do Gateway em uma sessão
tmux nomeada e se anexa automaticamente a partir de terminais interativos. Shells
não interativos permanecem desanexados e imprimem `tmux attach -t openclaw-gateway-watch-main`; use
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` para manter uma execução interativa
desanexada, ou `pnpm gateway:watch:raw` para o modo watch em primeiro plano. O watcher
recarrega quando há alterações relevantes no código-fonte, na configuração e nos metadados de plugins incluídos.
`pnpm openclaw setup` é a etapa única de inicialização da configuração/workspace local para um checkout novo.
`pnpm gateway:watch` não recompila `dist/control-ui`, então execute novamente `pnpm ui:build` após alterações em `ui/` ou use `pnpm ui:dev` ao desenvolver a Control UI.

Se você estiver usando intencionalmente o fluxo Bun, os comandos equivalentes são:

```bash
bun install
# Apenas na primeira execução (ou após redefinir a configuração/workspace local do OpenClaw)
bun run openclaw setup
bun run gateway:watch
```

### 2) Apontar o aplicativo para macOS para o Gateway em execução

Em **OpenClaw.app**:

- Modo de conexão: **Local**
  O aplicativo se conectará ao gateway em execução na porta configurada.

### 3) Verificar

- O status do Gateway no aplicativo deve mostrar **“Usando gateway existente …”**
- Ou via CLI:

```bash
openclaw health
```

### Problemas comuns

- **Porta errada:** o WS do Gateway usa `ws://127.0.0.1:18789` por padrão; mantenha o aplicativo e a CLI na mesma porta.
- **Onde fica o estado:**
  - Estado de canal/provedor: `~/.openclaw/credentials/`
  - Perfis de autenticação de modelo: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessões: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## Mapa de armazenamento de credenciais

Use isto ao depurar autenticação ou decidir o que fazer backup:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token de bot do Telegram**: configuração/env ou `channels.telegram.tokenFile` (apenas arquivo regular; symlinks rejeitados)
- **Token de bot do Discord**: configuração/env ou SecretRef (provedores env/file/exec)
- **Tokens do Slack**: configuração/env (`channels.slack.*`)
- **Allowlists de pareamento**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (conta padrão)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (contas não padrão)
- **Perfis de autenticação de modelo**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload de segredos com backend em arquivo (opcional)**: `~/.openclaw/secrets.json`
- **Importação OAuth legada**: `~/.openclaw/credentials/oauth.json`
  Mais detalhes: [Segurança](/pt-BR/gateway/security#credential-storage-map).

## Atualização (sem estragar sua configuração)

- Mantenha `~/.openclaw/workspace` e `~/.openclaw/` como “suas coisas”; não coloque prompts/configurações pessoais no repo `openclaw`.
- Atualização do código-fonte: `git pull` + a etapa de instalação do gerenciador de pacotes escolhido (`pnpm install` por padrão; `bun install` para o fluxo Bun) + continue usando o comando `gateway:watch` correspondente.

## Linux (serviço de usuário systemd)

Instalações Linux usam um serviço **de usuário** do systemd. Por padrão, o systemd interrompe
serviços de usuário no logout/ocioso, o que encerra o Gateway. O onboarding tenta habilitar
lingering para você (pode solicitar sudo). Se ainda estiver desativado, execute:

```bash
sudo loginctl enable-linger $USER
```

Para servidores sempre ativos ou multiusuário, considere um serviço **de sistema** em vez de um
serviço de usuário (sem necessidade de lingering). Consulte o [runbook do Gateway](/pt-BR/gateway) para as notas do systemd.

## Documentos relacionados

- [Runbook do Gateway](/pt-BR/gateway) (flags, supervisão, portas)
- [Configuração do Gateway](/pt-BR/gateway/configuration) (schema de configuração + exemplos)
- [Discord](/pt-BR/channels/discord) e [Telegram](/pt-BR/channels/telegram) (tags de resposta + configurações de replyToMode)
- [Configuração do assistente OpenClaw](/pt-BR/start/openclaw)
- [Aplicativo para macOS](/pt-BR/platforms/macos) (ciclo de vida do gateway)
