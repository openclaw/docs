---
read_when:
    - Executar ou configurar a integração inicial da CLI
    - Configurando uma nova máquina
sidebarTitle: 'Onboarding: CLI'
summary: 'Onboarding da CLI: configuração guiada para Gateway, espaço de trabalho, canais e Skills'
title: Integração (CLI)
x-i18n:
    generated_at: "2026-04-30T10:09:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9e9ee3af82ab9f4a1af5d20e3680eb932a9428cb914bbc08c9a2bf83c94ec158
    source_path: start/wizard.md
    workflow: 16
---

A integração via CLI é a forma **recomendada** de configurar o OpenClaw no macOS,
Linux ou Windows (via WSL2; fortemente recomendado).
Ela configura um Gateway local ou uma conexão com Gateway remoto, além de canais, skills
e padrões de workspace em um único fluxo guiado.

```bash
openclaw onboard
```

<Info>
Primeiro chat mais rápido: abra a Control UI (nenhuma configuração de canal necessária). Execute
`openclaw dashboard` e converse no navegador. Docs: [Dashboard](/pt-BR/web/dashboard).
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
A integração via CLI inclui uma etapa de busca na web em que você pode escolher um provedor
como Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG ou Tavily. Alguns provedores exigem uma
chave de API, enquanto outros não precisam de chave. Você também pode configurar isso depois com
`openclaw configure --section web`. Docs: [Ferramentas web](/pt-BR/tools/web).
</Tip>

## Início rápido vs Avançado

A integração começa com **Início rápido** (padrões) vs **Avançado** (controle total).

<Tabs>
  <Tab title="Início rápido (padrões)">
    - Gateway local (loopback)
    - Padrão de workspace (ou workspace existente)
    - Porta do Gateway **18789**
    - Autenticação do Gateway **Token** (gerado automaticamente, mesmo em loopback)
    - Política de ferramentas padrão para novas configurações locais: `tools.profile: "coding"` (o perfil explícito existente é preservado)
    - Padrão de isolamento de MD: a integração local grava `session.dmScope: "per-channel-peer"` quando não definido. Detalhes: [Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference#outputs-and-internals)
    - Exposição por Tailscale **Desativada**
    - MDs do Telegram + WhatsApp usam **lista de permissões** por padrão (você será solicitado a informar seu número de telefone)

  </Tab>
  <Tab title="Avançado (controle total)">
    - Expõe todas as etapas (modo, workspace, gateway, canais, daemon, skills).

  </Tab>
</Tabs>

## O que a integração configura

O **modo local (padrão)** guia você por estas etapas:

1. **Modelo/Auth** — escolha qualquer provedor/fluxo de autenticação compatível (chave de API, OAuth ou autenticação manual específica do provedor), incluindo Custom Provider
   (compatível com OpenAI, compatível com Anthropic ou detecção automática Unknown). Escolha um modelo padrão.
   Nota de segurança: se este agente for executar ferramentas ou processar conteúdo de webhook/hooks, prefira o modelo mais forte de última geração disponível e mantenha a política de ferramentas restrita. Camadas mais fracas/antigas são mais fáceis de sofrer prompt injection.
   Para execuções não interativas, `--secret-input-mode ref` armazena referências baseadas em env nos perfis de autenticação em vez de valores de chave de API em texto simples.
   No modo `ref` não interativo, a variável de ambiente do provedor deve estar definida; passar flags de chave inline sem essa variável de ambiente falha rapidamente.
   Em execuções interativas, escolher o modo de referência secreta permite apontar para uma variável de ambiente ou uma referência de provedor configurada (`file` ou `exec`), com uma validação rápida de preflight antes de salvar.
   Para Anthropic, onboarding/configure interativo oferece **Anthropic Claude CLI** como o caminho local preferido e **chave de API da Anthropic** como o caminho de produção recomendado. Anthropic setup-token também continua disponível como um caminho de autenticação por token compatível.
2. **Workspace** — local dos arquivos do agente (padrão `~/.openclaw/workspace`). Semeia arquivos de bootstrap.
3. **Gateway** — porta, endereço de bind, modo de autenticação, exposição por Tailscale.
   No modo de token interativo, escolha o armazenamento padrão de token em texto simples ou opte por SecretRef.
   Caminho SecretRef de token não interativo: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canais** — canais de chat integrados e empacotados, como BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp e outros.
5. **Daemon** — instala um LaunchAgent (macOS), uma unidade de usuário systemd (Linux/WSL2) ou uma Tarefa Agendada nativa do Windows com fallback para a pasta Inicializar por usuário.
   Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação do daemon o valida, mas não persiste o token resolvido nos metadados de ambiente do serviço supervisor.
   Se a autenticação por token exigir um token e o SecretRef de token configurado não for resolvido, a instalação do daemon é bloqueada com orientação acionável.
   Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação do daemon é bloqueada até que o modo seja definido explicitamente.
6. **Verificação de integridade** — inicia o Gateway e verifica se ele está em execução.
7. **Skills** — instala skills recomendadas e dependências opcionais.

<Note>
Executar a integração novamente **não** apaga nada, a menos que você escolha explicitamente **Redefinir** (ou passe `--reset`).
Por padrão, `--reset` da CLI redefine configuração, credenciais e sessões; use `--reset-scope full` para incluir o workspace.
Se a configuração for inválida ou contiver chaves legadas, a integração solicitará que você execute `openclaw doctor` primeiro.
</Note>

O **modo remoto** configura apenas o cliente local para se conectar a um Gateway em outro lugar.
Ele **não** instala nem altera nada no host remoto.

## Adicionar outro agente

Use `openclaw agents add <name>` para criar um agente separado com seu próprio workspace,
sessões e perfis de autenticação. Executar sem `--workspace` inicia a integração.

O que ele define:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Notas:

- Workspaces padrão seguem `~/.openclaw/workspace-<agentId>`.
- Adicione `bindings` para rotear mensagens recebidas (a integração pode fazer isso).
- Flags não interativas: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referência completa

Para detalhamentos passo a passo e saídas de configuração, consulte
[Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference).
Para exemplos não interativos, consulte [Automação da CLI](/pt-BR/start/wizard-cli-automation).
Para a referência técnica mais aprofundada, incluindo detalhes de RPC, consulte
[Referência de integração](/pt-BR/reference/wizard).

## Docs relacionados

- Referência de comandos da CLI: [`openclaw onboard`](/pt-BR/cli/onboard)
- Visão geral da integração: [Visão geral da integração](/pt-BR/start/onboarding-overview)
- Integração do app macOS: [Integração](/pt-BR/start/onboarding)
- Ritual de primeira execução do agente: [Bootstrap do agente](/pt-BR/start/bootstrapping)
