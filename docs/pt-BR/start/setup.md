---
read_when:
    - Configurar uma nova máquina
    - Você quer “o mais recente e melhor” sem quebrar sua configuração pessoal
summary: Configuração avançada e fluxos de trabalho de desenvolvimento para OpenClaw
title: Configuração
x-i18n:
    generated_at: "2026-04-24T06:13:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4a965f39a14697a677c89ccadeb2b11b10c8e704e81e00619fffd5abe2ebc83
    source_path: start/setup.md
    workflow: 15
---

<Note>
Se você estiver configurando pela primeira vez, comece com [Primeiros passos](/pt-BR/start/getting-started).
Para detalhes do onboarding, consulte [Onboarding (CLI)](/pt-BR/start/wizard).
</Note>

## TL;DR

Escolha um fluxo de configuração com base na frequência com que você quer atualizações e se deseja executar o Gateway você mesmo:

- **Personalização vive fora do repositório:** mantenha sua configuração e workspace em `~/.openclaw/openclaw.json` e `~/.openclaw/workspace/` para que atualizações do repositório não os afetem.
- **Fluxo estável (recomendado para a maioria):** instale o app do macOS e deixe-o executar o Gateway empacotado.
- **Fluxo bleeding edge (dev):** execute você mesmo o Gateway via `pnpm gateway:watch` e depois deixe o app do macOS se conectar em modo Local.

## Pré-requisitos (a partir do código-fonte)

- Node 24 recomendado (Node 22 LTS, atualmente `22.14+`, ainda compatível)
- `pnpm` preferido (ou Bun se você usar intencionalmente o [fluxo Bun](/pt-BR/install/bun))
- Docker (opcional; apenas para configuração/e2e em contêiner — consulte [Docker](/pt-BR/install/docker))

## Estratégia de personalização (para que atualizações não machuquem)

Se você quer “100% personalizado para mim” _e_ atualizações fáceis, mantenha sua personalização em:

- **Configuração:** `~/.openclaw/openclaw.json` (estilo JSON/JSON5)
- **Workspace:** `~/.openclaw/workspace` (Skills, prompts, memórias; torne isso um repositório git privado)

Inicialize uma vez:

```bash
openclaw setup
```

De dentro deste repositório, use a entrada local da CLI:

```bash
openclaw setup
```

Se você ainda não tiver uma instalação global, execute via `pnpm openclaw setup` (ou `bun run openclaw setup` se estiver usando o fluxo Bun).

## Executar o Gateway a partir deste repositório

Após `pnpm build`, você pode executar diretamente a CLI empacotada:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Fluxo estável (app do macOS primeiro)

1. Instale e inicie o **OpenClaw.app** (barra de menu).
2. Conclua a checklist de onboarding/permissões (prompts TCC).
3. Garanta que o Gateway esteja em **Local** e em execução (o app o gerencia).
4. Vincule superfícies (exemplo: WhatsApp):

```bash
openclaw channels login
```

5. Verificação rápida:

```bash
openclaw health
```

Se o onboarding não estiver disponível na sua build:

- Execute `openclaw setup`, depois `openclaw channels login`, depois inicie o Gateway manualmente (`openclaw gateway`).

## Fluxo bleeding edge (Gateway em um terminal)

Objetivo: trabalhar no Gateway TypeScript, obter hot reload e manter a interface do app do macOS conectada.

### 0) (Opcional) Executar também o app do macOS a partir do código-fonte

Se você também quiser o app do macOS em bleeding edge:

```bash
./scripts/restart-mac.sh
```

### 1) Iniciar o Gateway de desenvolvimento

```bash
pnpm install
# Apenas na primeira execução (ou após redefinir configuração/workspace local do OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` executa o gateway em modo watch e recarrega em alterações relevantes de código-fonte,
configuração e metadados de Plugin empacotado.
`pnpm openclaw setup` é a etapa única de inicialização de configuração/workspace local para um checkout novo.
`pnpm gateway:watch` não recompila `dist/control-ui`, então execute novamente `pnpm ui:build` após alterações em `ui/` ou use `pnpm ui:dev` enquanto desenvolve a Control UI.

Se você estiver usando intencionalmente o fluxo Bun, os comandos equivalentes são:

```bash
bun install
# Apenas na primeira execução (ou após redefinir configuração/workspace local do OpenClaw)
bun run openclaw setup
bun run gateway:watch
```

### 2) Aponte o app do macOS para o Gateway em execução

No **OpenClaw.app**:

- Modo de conexão: **Local**
  O app se conectará ao gateway em execução na porta configurada.

### 3) Verificar

- O status do Gateway no app deve mostrar **“Using existing gateway …”**
- Ou via CLI:

```bash
openclaw health
```

### Armadilhas comuns

- **Porta errada:** o Gateway WS usa por padrão `ws://127.0.0.1:18789`; mantenha app + CLI na mesma porta.
- **Onde o estado fica:**
  - Estado de canal/provedor: `~/.openclaw/credentials/`
  - Perfis de autenticação de modelo: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessões: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## Mapa de armazenamento de credenciais

Use isto ao depurar autenticação ou decidir o que fazer backup:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token de bot do Telegram**: config/env ou `channels.telegram.tokenFile` (somente arquivo regular; symlinks rejeitados)
- **Token de bot do Discord**: config/env ou SecretRef (provedores env/file/exec)
- **Tokens do Slack**: config/env (`channels.slack.*`)
- **Allowlists de pareamento**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (conta padrão)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (contas não padrão)
- **Perfis de autenticação de modelo**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Carga útil de segredos com suporte a arquivo (opcional)**: `~/.openclaw/secrets.json`
- **Importação legada de OAuth**: `~/.openclaw/credentials/oauth.json`
  Mais detalhes: [Segurança](/pt-BR/gateway/security#credential-storage-map).

## Atualizar (sem destruir sua configuração)

- Mantenha `~/.openclaw/workspace` e `~/.openclaw/` como “suas coisas”; não coloque prompts/configuração pessoais no repositório `openclaw`.
- Atualizando o código-fonte: `git pull` + a etapa do gerenciador de pacotes escolhida (`pnpm install` por padrão; `bun install` para fluxo Bun) + continue usando o comando `gateway:watch` correspondente.

## Linux (serviço de usuário systemd)

Instalações Linux usam um serviço **de usuário** systemd. Por padrão, o systemd interrompe serviços de usuário no logout/inatividade, o que mata o Gateway. O onboarding tenta ativar lingering para você (pode pedir sudo). Se ainda estiver desativado, execute:

```bash
sudo loginctl enable-linger $USER
```

Para servidores sempre ativos ou multiusuário, considere um serviço **de sistema** em vez de
um serviço de usuário (não precisa de lingering). Consulte [Runbook do Gateway](/pt-BR/gateway) para observações sobre systemd.

## Documentos relacionados

- [Runbook do Gateway](/pt-BR/gateway) (flags, supervisão, portas)
- [Configuração do Gateway](/pt-BR/gateway/configuration) (schema de configuração + exemplos)
- [Discord](/pt-BR/channels/discord) e [Telegram](/pt-BR/channels/telegram) (tags de resposta + configurações `replyToMode`)
- [Configuração do assistente OpenClaw](/pt-BR/start/openclaw)
- [App do macOS](/pt-BR/platforms/macos) (ciclo de vida do gateway)
