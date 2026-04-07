---
read_when:
    - Ao executar ou configurar o onboarding da CLI
    - Ao configurar uma nova máquina
sidebarTitle: 'Onboarding: CLI'
summary: 'Onboarding da CLI: configuração guiada para gateway, workspace, canais e Skills'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-04-07T05:31:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6773b07afa8babf1b5ac94d857063d08094a962ee21ec96ca966e99ad57d107d
    source_path: start/wizard.md
    workflow: 15
---

# Onboarding (CLI)

O onboarding da CLI é a forma **recomendada** de configurar o OpenClaw no macOS,
Linux ou Windows (via WSL2; fortemente recomendado).
Ele configura um Gateway local ou uma conexão com Gateway remoto, além de canais, Skills
e padrões de workspace em um único fluxo guiado.

```bash
openclaw onboard
```

<Info>
A forma mais rápida de iniciar o primeiro chat: abra a Control UI (sem necessidade de configurar canais). Execute
`openclaw dashboard` e converse no navegador. Documentação: [Dashboard](/web/dashboard).
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
O onboarding da CLI inclui uma etapa de busca na web em que você pode escolher um provedor
como Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG ou Tavily. Alguns provedores exigem uma
chave de API, enquanto outros não usam chave. Você também pode configurar isso depois com
`openclaw configure --section web`. Documentação: [Ferramentas web](/pt-BR/tools/web).
</Tip>

## QuickStart vs Advanced

O onboarding começa com **QuickStart** (padrões) vs **Advanced** (controle total).

<Tabs>
  <Tab title="QuickStart (padrões)">
    - Gateway local (loopback)
    - Workspace padrão (ou workspace existente)
    - Porta do Gateway **18789**
    - Auth do Gateway **Token** (gerado automaticamente, mesmo em loopback)
    - Política de ferramentas padrão para novas configurações locais: `tools.profile: "coding"` (o perfil explícito existente é preservado)
    - Padrão de isolamento de DM: o onboarding local grava `session.dmScope: "per-channel-peer"` quando não definido. Detalhes: [Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference#outputs-and-internals)
    - Exposição via Tailscale **Desativada**
    - DMs do Telegram + WhatsApp usam **allowlist** por padrão (você será solicitado a informar seu número de telefone)
  </Tab>
  <Tab title="Advanced (controle total)">
    - Expõe todas as etapas (modo, workspace, gateway, canais, daemon, Skills).
  </Tab>
</Tabs>

## O que o onboarding configura

**Modo local (padrão)** orienta você por estas etapas:

1. **Modelo/Auth** — escolha qualquer fluxo compatível de provedor/auth (chave de API, OAuth ou auth manual específica do provedor), incluindo Custom Provider
   (compatível com OpenAI, compatível com Anthropic ou auto-detecção Unknown). Escolha um modelo padrão.
   Observação de segurança: se este agente executar ferramentas ou processar conteúdo de webhook/hooks, prefira o modelo mais forte e mais recente disponível e mantenha a política de ferramentas restrita. Camadas mais fracas/antigas são mais fáceis de sofrer prompt injection.
   Para execuções não interativas, `--secret-input-mode ref` armazena refs baseadas em env em perfis auth em vez de valores de chave de API em texto simples.
   No modo não interativo `ref`, a variável de ambiente do provedor precisa estar definida; passar sinalizadores inline de chave sem essa variável de ambiente falha imediatamente.
   Em execuções interativas, escolher o modo de referência secreta permite apontar para uma variável de ambiente ou para uma referência de provedor configurada (`file` ou `exec`), com validação preliminar rápida antes de salvar.
   Para Anthropic, o onboarding/configure interativo oferece **Anthropic Claude CLI** como o caminho local preferido e **Anthropic API key** como o caminho de produção recomendado. O setup-token Anthropic também permanece disponível como caminho compatível de auth por token.
2. **Workspace** — local para arquivos do agente (padrão `~/.openclaw/workspace`). Inicializa arquivos de bootstrap.
3. **Gateway** — porta, endereço de bind, modo de auth, exposição via Tailscale.
   No modo interativo de token, escolha o armazenamento padrão em texto simples do token ou opte por SecretRef.
   Caminho SecretRef de token no modo não interativo: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canais** — canais de chat embutidos e empacotados, como BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp e outros.
5. **Daemon** — instala um LaunchAgent (macOS), unidade de usuário systemd (Linux/WSL2) ou tarefa agendada nativa do Windows com fallback por usuário na pasta Startup.
   Se a auth por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação do daemon o valida, mas não persiste o token resolvido nos metadados de ambiente do serviço supervisor.
   Se a auth por token exigir um token e o SecretRef de token configurado não puder ser resolvido, a instalação do daemon é bloqueada com orientação acionável.
   Se `gateway.auth.token` e `gateway.auth.password` estiverem ambos configurados e `gateway.auth.mode` não estiver definido, a instalação do daemon será bloqueada até que o modo seja definido explicitamente.
6. **Verificação de integridade** — inicia o Gateway e verifica se ele está em execução.
7. **Skills** — instala Skills recomendadas e dependências opcionais.

<Note>
Executar o onboarding novamente **não** apaga nada, a menos que você escolha explicitamente **Reset** (ou passe `--reset`).
Na CLI, `--reset` usa por padrão config, credenciais e sessões; use `--reset-scope full` para incluir o workspace.
Se a configuração for inválida ou contiver chaves legadas, o onboarding pedirá que você execute `openclaw doctor` primeiro.
</Note>

**Modo remoto** configura apenas o cliente local para se conectar a um Gateway em outro lugar.
Ele **não** instala nem altera nada no host remoto.

## Adicionar outro agente

Use `openclaw agents add <name>` para criar um agente separado com seu próprio workspace,
sessões e perfis auth. Executar sem `--workspace` inicia o onboarding.

O que ele define:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Observações:

- Workspaces padrão seguem `~/.openclaw/workspace-<agentId>`.
- Adicione `bindings` para rotear mensagens de entrada (o onboarding pode fazer isso).
- Sinalizadores não interativos: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referência completa

Para decomposições detalhadas passo a passo e saídas de configuração, consulte
[Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference).
Para exemplos não interativos, consulte [Automação da CLI](/pt-BR/start/wizard-cli-automation).
Para a referência técnica mais profunda, incluindo detalhes de RPC, consulte
[Referência de onboarding](/pt-BR/reference/wizard).

## Documentação relacionada

- Referência de comando da CLI: [`openclaw onboard`](/cli/onboard)
- Visão geral do onboarding: [Visão geral do onboarding](/pt-BR/start/onboarding-overview)
- Onboarding do app para macOS: [Onboarding](/pt-BR/start/onboarding)
- Ritual da primeira execução do agente: [Bootstrapping do agente](/pt-BR/start/bootstrapping)
