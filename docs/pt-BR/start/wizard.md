---
read_when:
    - Executando ou configurando o onboarding da CLI
    - Configurando uma nova máquina
sidebarTitle: 'Onboarding: CLI'
summary: 'Onboarding da CLI: configuração guiada para gateway, workspace, canais e Skills'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-04-24T06:13:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 919a4ab57f42f663e98e77c967e08e7ad7afbb193bd048ca1dedc884002d3801
    source_path: start/wizard.md
    workflow: 15
---

O onboarding da CLI é a forma **recomendada** de configurar o OpenClaw em macOS,
Linux ou Windows (via WSL2; fortemente recomendado).
Ele configura um Gateway local ou uma conexão com Gateway remoto, além de canais, Skills
e padrões de workspace em um único fluxo guiado.

```bash
openclaw onboard
```

<Info>
Forma mais rápida de fazer o primeiro chat: abra a Control UI (nenhuma configuração de canal é necessária). Execute
`openclaw dashboard` e converse no navegador. Documentação: [Dashboard](/pt-BR/web/dashboard).
</Info>

Para reconfigurar depois:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` não implica modo não interativo. Para scripts, use `--non-interactive`.
</Note>

<Tip>
O onboarding da CLI inclui uma etapa de web search na qual você pode escolher um provedor
como Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG ou Tavily. Alguns provedores exigem uma
chave de API, enquanto outros não exigem. Você também pode configurar isso depois com
`openclaw configure --section web`. Documentação: [Web tools](/pt-BR/tools/web).
</Tip>

## QuickStart vs Avançado

O onboarding começa com **QuickStart** (padrões) vs **Advanced** (controle total).

<Tabs>
  <Tab title="QuickStart (padrões)">
    - Gateway local (loopback)
    - Workspace padrão (ou workspace existente)
    - Porta do Gateway **18789**
    - Autenticação do Gateway por **Token** (gerado automaticamente, mesmo em loopback)
    - Política padrão de ferramentas para novas configurações locais: `tools.profile: "coding"` (perfil explícito existente é preservado)
    - Padrão de isolamento de DM: o onboarding local grava `session.dmScope: "per-channel-peer"` quando não definido. Detalhes: [CLI Setup Reference](/pt-BR/start/wizard-cli-reference#outputs-and-internals)
    - Exposição por Tailscale **Desligada**
    - DMs de Telegram + WhatsApp usam **allowlist** por padrão (você será solicitado a informar seu número de telefone)
  </Tab>
  <Tab title="Advanced (controle total)">
    - Expõe todas as etapas (modo, workspace, gateway, canais, daemon, Skills).
  </Tab>
</Tabs>

## O que o onboarding configura

**Modo local (padrão)** orienta você por estas etapas:

1. **Modelo/Autenticação** — escolha qualquer fluxo compatível de provedor/autenticação (chave de API, OAuth ou autenticação manual específica do provedor), incluindo Custom Provider
   (compatível com OpenAI, compatível com Anthropic ou Unknown auto-detect). Escolha um modelo padrão.
   Observação de segurança: se este agente for executar ferramentas ou processar conteúdo de webhook/hooks, prefira o modelo mais forte e de geração mais recente disponível e mantenha a política de ferramentas estrita. Camadas mais fracas/antigas são mais fáceis de sofrer prompt injection.
   Para execuções não interativas, `--secret-input-mode ref` armazena refs baseados em env em perfis de autenticação em vez de valores de chave de API em texto simples.
   No modo `ref` não interativo, a variável de env do provedor deve estar definida; passar flags de chave inline sem essa variável de env falha imediatamente.
   Em execuções interativas, escolher o modo de referência secreta permite apontar para uma variável de ambiente ou para uma ref de provedor configurada (`file` ou `exec`), com validação rápida preliminar antes de salvar.
   Para Anthropic, o onboarding/configure interativo oferece **Anthropic Claude CLI** como caminho local preferido e **chave de API da Anthropic** como caminho de produção recomendado. O setup-token da Anthropic também continua disponível como caminho compatível de autenticação por token.
2. **Workspace** — local para arquivos do agente (padrão `~/.openclaw/workspace`). Inicializa arquivos de bootstrap.
3. **Gateway** — porta, endereço de bind, modo de autenticação, exposição por Tailscale.
   No modo interativo por token, escolha armazenamento padrão de token em texto simples ou opte por SecretRef.
   Caminho de SecretRef para token em modo não interativo: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canais** — canais de chat integrados e empacotados como BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp e mais.
5. **Daemon** — instala um LaunchAgent (macOS), unidade de usuário systemd (Linux/WSL2) ou tarefa nativa agendada do Windows com fallback por usuário na pasta Startup.
   Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação do daemon o valida, mas não persiste o token resolvido nos metadados do ambiente do serviço supervisionado.
   Se a autenticação por token exigir um token e o SecretRef do token configurado não puder ser resolvido, a instalação do daemon é bloqueada com orientação acionável.
   Se `gateway.auth.token` e `gateway.auth.password` estiverem ambos configurados e `gateway.auth.mode` não estiver definido, a instalação do daemon é bloqueada até que o modo seja definido explicitamente.
6. **Verificação de saúde** — inicia o Gateway e verifica se ele está em execução.
7. **Skills** — instala Skills recomendadas e dependências opcionais.

<Note>
Executar o onboarding novamente **não** apaga nada, a menos que você escolha explicitamente **Reset** (ou passe `--reset`).
O `--reset` da CLI usa por padrão configuração, credenciais e sessões; use `--reset-scope full` para incluir o workspace.
Se a configuração estiver inválida ou contiver chaves legadas, o onboarding pedirá que você execute `openclaw doctor` primeiro.
</Note>

**Modo remoto** apenas configura o cliente local para se conectar a um Gateway em outro lugar.
Ele **não** instala nem altera nada no host remoto.

## Adicionar outro agente

Use `openclaw agents add <name>` para criar um agente separado com seu próprio workspace,
sessões e perfis de autenticação. Executar sem `--workspace` inicia o onboarding.

O que ele define:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Observações:

- Workspaces padrão seguem `~/.openclaw/workspace-<agentId>`.
- Adicione `bindings` para rotear mensagens de entrada (o onboarding pode fazer isso).
- Flags não interativas: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referência completa

Para detalhamentos passo a passo e saídas de configuração, consulte
[CLI Setup Reference](/pt-BR/start/wizard-cli-reference).
Para exemplos não interativos, consulte [CLI Automation](/pt-BR/start/wizard-cli-automation).
Para a referência técnica mais profunda, incluindo detalhes de RPC, consulte
[Onboarding Reference](/pt-BR/reference/wizard).

## Documentação relacionada

- Referência de comando da CLI: [`openclaw onboard`](/pt-BR/cli/onboard)
- Visão geral do onboarding: [Onboarding Overview](/pt-BR/start/onboarding-overview)
- Onboarding do app macOS: [Onboarding](/pt-BR/start/onboarding)
- Ritual de primeira execução do agente: [Agent Bootstrapping](/pt-BR/start/bootstrapping)
