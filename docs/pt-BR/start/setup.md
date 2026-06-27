---
read_when:
    - Configurando uma nova máquina
    - Você quer "o mais recente + melhor" sem quebrar sua configuração pessoal
summary: Configuração avançada e fluxos de trabalho de desenvolvimento para OpenClaw
title: Configuração
x-i18n:
    generated_at: "2026-06-27T18:12:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81cad59d4eab731ba548452211bfc578d6f79e38431057c52cc3580d3b9d9944
    source_path: start/setup.md
    workflow: 16
---

<Note>
Se você está configurando pela primeira vez, comece com [Introdução](/pt-BR/start/getting-started).
Para detalhes de onboarding, consulte [Onboarding (CLI)](/pt-BR/start/wizard).
</Note>

## TL;DR

Escolha um fluxo de configuração com base na frequência com que você quer atualizações e se quer executar o Gateway por conta própria:

- **A personalização fica fora do repo:** mantenha sua configuração e seu workspace em `~/.openclaw/openclaw.json` e `~/.openclaw/workspace/` para que as atualizações do repo não mexam neles.
- **Fluxo estável (recomendado para a maioria):** instale o app para macOS e deixe que ele execute o Gateway empacotado.
- **Fluxo de ponta (dev):** execute o Gateway por conta própria via `pnpm gateway:watch` e depois deixe o app para macOS se conectar no modo Local.

## Pré-requisitos (a partir do código-fonte)

- Node 24 recomendado (Node 22 LTS, atualmente `22.19+`, ainda suportado)
- `pnpm` é obrigatório para checkouts do código-fonte. O OpenClaw carrega plugins empacotados dos
  pacotes do workspace pnpm `extensions/*` no modo dev, então `npm install` na raiz
  não prepara a árvore completa do código-fonte.
- Docker (opcional; apenas para configuração/e2e em contêiner - veja [Docker](/pt-BR/install/docker))

## Estratégia de personalização (para que atualizações não prejudiquem)

Se você quer algo "100% personalizado para mim" _e_ atualizações fáceis, mantenha sua personalização em:

- **Configuração:** `~/.openclaw/openclaw.json` (JSON/parecido com JSON5)
- **Workspace:** `~/.openclaw/workspace` (skills, prompts, memórias; transforme-o em um repo git privado)

Inicialize uma vez:

```bash
openclaw setup
```

De dentro deste repo, use a entrada local da CLI:

```bash
openclaw setup
```

Se você ainda não tiver uma instalação global, execute via `pnpm openclaw setup`.

## Executar o Gateway a partir deste repo

Depois de `pnpm build`, você pode executar a CLI empacotada diretamente:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Fluxo estável (app para macOS primeiro)

1. Instale + abra o **OpenClaw.app** (barra de menus).
2. Conclua a lista de onboarding/permissões (prompts TCC).
3. Verifique se o Gateway está em **Local** e em execução (o app o gerencia).
4. Vincule superfícies (exemplo: WhatsApp):

```bash
openclaw channels login
```

5. Faça uma verificação rápida:

```bash
openclaw health
```

Se o onboarding não estiver disponível no seu build:

- Execute `openclaw setup`, depois `openclaw channels login` e então inicie o Gateway manualmente (`openclaw gateway`).

## Fluxo de ponta (Gateway em um terminal)

Objetivo: trabalhar no Gateway TypeScript, obter hot reload e manter a UI do app para macOS conectada.

### 0) (Opcional) Executar o app para macOS a partir do código-fonte também

Se você também quer o app para macOS na ponta:

```bash
./scripts/restart-mac.sh
```

### 1) Inicie o Gateway de dev

```bash
pnpm install
# Apenas na primeira execução (ou depois de redefinir a configuração/workspace local do OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` inicia ou reinicia o processo de observação do Gateway em uma sessão tmux
nomeada e se anexa automaticamente a terminais interativos. Shells não interativos permanecem
desanexados e imprimem `tmux attach -t openclaw-gateway-watch-main`; use
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` para manter uma execução interativa
desanexada, ou `pnpm gateway:watch:raw` para o modo de observação em primeiro plano. O watcher
recarrega em mudanças relevantes de código-fonte, configuração e metadados de plugins empacotados. Se o
Gateway observado sair durante a inicialização, `gateway:watch` executa
`openclaw doctor --fix --non-interactive` uma vez e tenta novamente; defina
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` para desativar essa etapa de reparo somente de dev.
`pnpm openclaw setup` é a etapa única de inicialização da configuração/workspace local para um checkout novo.
`pnpm gateway:watch` não recompila `dist/control-ui`, então execute novamente `pnpm ui:build` depois de mudanças em `ui/` ou use `pnpm ui:dev` ao desenvolver a Control UI.

### 2) Aponte o app para macOS para o seu Gateway em execução

No **OpenClaw.app**:

- Modo de conexão: **Local**
  O app se conectará ao gateway em execução na porta configurada.

### 3) Verifique

- O status do Gateway no app deve mostrar **"Usando gateway existente …"**
- Ou via CLI:

```bash
openclaw health
```

### Armadilhas comuns

- **Porta errada:** o WS do Gateway usa por padrão `ws://127.0.0.1:18789`; mantenha app + CLI na mesma porta.
- **Onde o estado fica:**
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
- **Listas de permissão de pareamento**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (conta padrão)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (contas não padrão)
- **Perfis de autenticação de modelo**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload de segredos baseado em arquivo (opcional)**: `~/.openclaw/secrets.json`
- **Importação OAuth legada**: `~/.openclaw/credentials/oauth.json`
  Mais detalhes: [Segurança](/pt-BR/gateway/security#credential-storage-map).

## Atualização (sem destruir sua configuração)

- Mantenha `~/.openclaw/workspace` e `~/.openclaw/` como "suas coisas"; não coloque prompts/configurações pessoais no repo `openclaw`.
- Atualização do código-fonte: `git pull` + `pnpm install` + continue usando `pnpm gateway:watch`.

## Linux (serviço de usuário systemd)

Instalações no Linux usam um serviço **de usuário** do systemd. Por padrão, o systemd interrompe serviços de usuário
ao fazer logout/ficar ocioso, o que encerra o Gateway. O onboarding tenta habilitar
lingering para você (pode solicitar sudo). Se ainda estiver desativado, execute:

```bash
sudo loginctl enable-linger $USER
```

Para servidores sempre ativos ou multiusuário, considere um serviço **de sistema** em vez de um
serviço de usuário (sem necessidade de lingering). Veja o [runbook do Gateway](/pt-BR/gateway) para as observações sobre systemd.

## Documentos relacionados

- [Runbook do Gateway](/pt-BR/gateway) (flags, supervisão, portas)
- [Configuração do Gateway](/pt-BR/gateway/configuration) (schema de configuração + exemplos)
- [Discord](/pt-BR/channels/discord) e [Telegram](/pt-BR/channels/telegram) (tags de resposta + configurações de replyToMode)
- [Configuração do assistente OpenClaw](/pt-BR/start/openclaw)
- [App para macOS](/pt-BR/platforms/macos) (ciclo de vida do gateway)
