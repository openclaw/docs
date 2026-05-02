---
read_when:
    - Configurando uma nova máquina
    - Você quer o “mais recente + melhor” sem quebrar sua configuração pessoal
summary: Configuração avançada e fluxos de trabalho de desenvolvimento para OpenClaw
title: Configuração
x-i18n:
    generated_at: "2026-05-02T05:56:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 101f7911d4a4cba139dd7a464b2ed82e2c80c630ba6ea58486309642c6690ee9
    source_path: start/setup.md
    workflow: 16
---

<Note>
Se você está configurando pela primeira vez, comece com [Primeiros passos](/pt-BR/start/getting-started).
Para detalhes de onboarding, consulte [Onboarding (CLI)](/pt-BR/start/wizard).
</Note>

## Resumo

Escolha um fluxo de configuração com base na frequência com que você quer atualizações e se quer executar o Gateway por conta própria:

- **A personalização fica fora do repositório:** mantenha sua configuração e workspace em `~/.openclaw/openclaw.json` e `~/.openclaw/workspace/` para que atualizações do repositório não os afetem.
- **Fluxo estável (recomendado para a maioria):** instale o app para macOS e deixe-o executar o Gateway integrado.
- **Fluxo de ponta (dev):** execute o Gateway por conta própria via `pnpm gateway:watch` e deixe o app para macOS se conectar no modo Local.

## Pré-requisitos (a partir do código-fonte)

- Node 24 recomendado (Node 22 LTS, atualmente `22.14+`, ainda com suporte)
- `pnpm` é obrigatório para checkouts do código-fonte. O OpenClaw carrega plugins integrados dos pacotes do workspace pnpm
  `extensions/*` no modo dev, portanto `npm install` na raiz
  não prepara a árvore completa do código-fonte.
- Docker (opcional; apenas para configuração/e2e em contêiner — consulte [Docker](/pt-BR/install/docker))

## Estratégia de personalização (para que as atualizações não atrapalhem)

Se você quer algo “100% personalizado para mim” _e_ atualizações fáceis, mantenha sua personalização em:

- **Configuração:** `~/.openclaw/openclaw.json` (JSON/JSON5-ish)
- **Workspace:** `~/.openclaw/workspace` (Skills, prompts, memórias; transforme-o em um repositório git privado)

Inicialize uma vez:

```bash
openclaw setup
```

De dentro deste repositório, use a entrada local da CLI:

```bash
openclaw setup
```

Se você ainda não tiver uma instalação global, execute via `pnpm openclaw setup`.

## Executar o Gateway a partir deste repositório

Após `pnpm build`, você pode executar a CLI empacotada diretamente:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Fluxo estável (app para macOS primeiro)

1. Instale e abra o **OpenClaw.app** (barra de menus).
2. Conclua a lista de onboarding/permissões (prompts de TCC).
3. Verifique se o Gateway está em **Local** e em execução (o app o gerencia).
4. Vincule superfícies (exemplo: WhatsApp):

```bash
openclaw channels login
```

5. Verificação básica:

```bash
openclaw health
```

Se o onboarding não estiver disponível na sua build:

- Execute `openclaw setup`, depois `openclaw channels login` e então inicie o Gateway manualmente (`openclaw gateway`).

## Fluxo de ponta (Gateway em um terminal)

Objetivo: trabalhar no Gateway em TypeScript, obter recarregamento a quente e manter a interface do app para macOS conectada.

### 0) (Opcional) Executar também o app para macOS a partir do código-fonte

Se você também quiser o app para macOS no estado mais recente:

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

`gateway:watch` inicia ou reinicia o processo de observação do Gateway em uma sessão tmux
nomeada e anexa automaticamente a partir de terminais interativos. Shells não interativos permanecem
desanexados e imprimem `tmux attach -t openclaw-gateway-watch-main`; use
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` para manter uma execução interativa
desanexada, ou `pnpm gateway:watch:raw` para o modo de observação em primeiro plano. O observador
recarrega em alterações relevantes no código-fonte, na configuração e nos metadados de plugins integrados.
`pnpm openclaw setup` é a etapa única de inicialização da configuração/workspace local para um checkout novo.
`pnpm gateway:watch` não reconstrói `dist/control-ui`, então execute novamente `pnpm ui:build` após alterações em `ui/` ou use `pnpm ui:dev` enquanto desenvolve a Control UI.

### 2) Apontar o app para macOS para o Gateway em execução

No **OpenClaw.app**:

- Modo de conexão: **Local**
  O app se conectará ao gateway em execução na porta configurada.

### 3) Verificar

- O status do Gateway no app deve mostrar **“Usando gateway existente …”**
- Ou via CLI:

```bash
openclaw health
```

### Armadilhas comuns

- **Porta errada:** o padrão do WS do Gateway é `ws://127.0.0.1:18789`; mantenha o app + CLI na mesma porta.
- **Onde o estado fica:**
  - Estado de canal/provedor: `~/.openclaw/credentials/`
  - Perfis de autenticação de modelos: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessões: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## Mapa de armazenamento de credenciais

Use isto ao depurar autenticação ou decidir o que incluir no backup:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token do bot do Telegram**: config/env ou `channels.telegram.tokenFile` (somente arquivo regular; symlinks rejeitados)
- **Token do bot do Discord**: config/env ou SecretRef (provedores env/file/exec)
- **Tokens do Slack**: config/env (`channels.slack.*`)
- **Listas de permissão de pareamento**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (conta padrão)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (contas não padrão)
- **Perfis de autenticação de modelos**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload de segredos baseado em arquivo (opcional)**: `~/.openclaw/secrets.json`
- **Importação OAuth legada**: `~/.openclaw/credentials/oauth.json`
  Mais detalhes: [Segurança](/pt-BR/gateway/security#credential-storage-map).

## Atualização (sem estragar sua configuração)

- Mantenha `~/.openclaw/workspace` e `~/.openclaw/` como “suas coisas”; não coloque prompts/configurações pessoais no repositório `openclaw`.
- Atualizando o código-fonte: `git pull` + `pnpm install` + continue usando `pnpm gateway:watch`.

## Linux (serviço de usuário systemd)

Instalações Linux usam um serviço de **usuário** do systemd. Por padrão, o systemd interrompe serviços de usuário
ao fazer logout/ficar ocioso, o que encerra o Gateway. O onboarding tenta habilitar
lingering para você (pode solicitar sudo). Se ainda estiver desativado, execute:

```bash
sudo loginctl enable-linger $USER
```

Para servidores sempre ativos ou multiusuário, considere um serviço de **sistema** em vez de um
serviço de usuário (sem necessidade de lingering). Consulte o [runbook do Gateway](/pt-BR/gateway) para as notas sobre systemd.

## Documentos relacionados

- [Runbook do Gateway](/pt-BR/gateway) (flags, supervisão, portas)
- [Configuração do Gateway](/pt-BR/gateway/configuration) (schema de configuração + exemplos)
- [Discord](/pt-BR/channels/discord) e [Telegram](/pt-BR/channels/telegram) (tags de resposta + configurações replyToMode)
- [Configuração do assistente OpenClaw](/pt-BR/start/openclaw)
- [App para macOS](/pt-BR/platforms/macos) (ciclo de vida do gateway)
