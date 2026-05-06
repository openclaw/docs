---
read_when:
    - Executando ou configurando a integração inicial da CLI
    - Configurando uma nova máquina
sidebarTitle: 'Onboarding: CLI'
summary: 'Integração da CLI: configuração guiada para Gateway, espaço de trabalho, canais e Skills'
title: Configuração inicial (CLI)
x-i18n:
    generated_at: "2026-05-06T09:14:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4872c150950a811e5cdb8830fe635886f7c3ed0f1d62352b71be56feda64691
    source_path: start/wizard.md
    workflow: 16
---

A integração pela CLI é a forma **recomendada** de configurar o OpenClaw no macOS,
Linux ou Windows (via WSL2; fortemente recomendado).
Ela configura um Gateway local ou uma conexão com Gateway remoto, além de canais, Skills
e padrões do workspace em um fluxo guiado.

```bash
openclaw onboard
```

<Info>
Primeiro chat mais rápido: abra a Control UI (nenhuma configuração de canal necessária). Execute
`openclaw dashboard` e converse no navegador. Docs: [Dashboard](/pt-BR/web/dashboard).
</Info>

Para reconfigurar mais tarde:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` não implica modo não interativo. Para scripts, use `--non-interactive`.
</Note>

<Tip>
A integração pela CLI inclui uma etapa de busca na web em que você pode escolher um provedor
como Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG ou Tavily. Alguns provedores exigem uma
chave de API, enquanto outros não exigem chave. Você também pode configurar isso mais tarde com
`openclaw configure --section web`. Docs: [Ferramentas web](/pt-BR/tools/web).
</Tip>

## Início Rápido vs Avançado

A integração começa com **Início Rápido** (padrões) vs **Avançado** (controle total).

<Tabs>
  <Tab title="Início Rápido (padrões)">
    - Gateway local (loopback)
    - Padrão do workspace (ou workspace existente)
    - Porta do Gateway **18789**
    - Autenticação do Gateway **Token** (gerado automaticamente, mesmo em loopback)
    - Padrão de política de ferramentas para novas configurações locais: `tools.profile: "coding"` (o perfil explícito existente é preservado)
    - Padrão de isolamento de DM: a integração local grava `session.dmScope: "per-channel-peer"` quando não definido. Detalhes: [Referência de Configuração da CLI](/pt-BR/start/wizard-cli-reference#outputs-and-internals)
    - Exposição por Tailscale **Desativada**
    - DMs do Telegram + WhatsApp usam **allowlist** por padrão (você será solicitado a informar seu número de telefone)

  </Tab>
  <Tab title="Avançado (controle total)">
    - Expõe todas as etapas (modo, workspace, Gateway, canais, daemon, Skills).

  </Tab>
</Tabs>

## O que a integração configura

O **modo local (padrão)** orienta você por estas etapas:

1. **Modelo/Autenticação** — escolha qualquer provedor/fluxo de autenticação compatível (chave de API, OAuth ou autenticação manual específica do provedor), incluindo Provedor Personalizado
   (compatível com OpenAI, compatível com Anthropic ou detecção automática Desconhecido). Escolha um modelo padrão.
   Nota de segurança: se este agente executará ferramentas ou processará conteúdo de Webhook/hooks, prefira o modelo mais forte de geração mais recente disponível e mantenha a política de ferramentas restrita. Camadas mais fracas/antigas são mais fáceis de sofrer injeção de prompt.
   Para execuções não interativas, `--secret-input-mode ref` armazena referências baseadas em env em perfis de autenticação em vez de valores de chave de API em texto simples.
   No modo não interativo `ref`, a variável de ambiente do provedor deve estar definida; passar flags de chave inline sem essa variável de ambiente falha rapidamente.
   Em execuções interativas, escolher o modo de referência secreta permite apontar para uma variável de ambiente ou uma referência de provedor configurada (`file` ou `exec`), com uma validação prévia rápida antes de salvar.
   Para Anthropic, a integração/configuração interativa oferece **Anthropic Claude CLI** como o caminho local preferido e **chave de API Anthropic** como o caminho de produção recomendado. Anthropic setup-token também continua disponível como um caminho compatível de autenticação por token.
2. **Workspace** — Local dos arquivos do agente (padrão `~/.openclaw/workspace`). Semeia arquivos de bootstrap.
3. **Gateway** — Porta, endereço de bind, modo de autenticação, exposição por Tailscale.
   No modo de token interativo, escolha o armazenamento padrão de token em texto simples ou opte por SecretRef.
   Caminho SecretRef de token não interativo: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canais** — canais de chat integrados e incluídos, como BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp e outros.
5. **Daemon** — Instala um LaunchAgent (macOS), unidade de usuário systemd (Linux/WSL2) ou Tarefa Agendada nativa do Windows com fallback por usuário na pasta Inicializar.
   Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação do daemon o valida, mas não persiste o token resolvido nos metadados de ambiente do serviço supervisor.
   Se a autenticação por token exigir um token e o SecretRef de token configurado não for resolvido, a instalação do daemon será bloqueada com orientação acionável.
   Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação do daemon será bloqueada até que o modo seja definido explicitamente.
6. **Verificação de integridade** — Inicia o Gateway e verifica se ele está em execução.
7. **Skills** — Instala Skills recomendadas e dependências opcionais.

<Note>
Executar a integração novamente **não** apaga nada, a menos que você escolha explicitamente **Redefinir** (ou passe `--reset`).
A CLI `--reset` redefine por padrão configuração, credenciais e sessões; use `--reset-scope full` para incluir o workspace.
Se a configuração for inválida ou contiver chaves legadas, a integração solicita que você execute `openclaw doctor` primeiro.
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
[Referência de Configuração da CLI](/pt-BR/start/wizard-cli-reference).
Para exemplos não interativos, consulte [Automação da CLI](/pt-BR/start/wizard-cli-automation).
Para a referência técnica mais aprofundada, incluindo detalhes de RPC, consulte
[Referência de Integração](/pt-BR/reference/wizard).

## Docs relacionados

- Referência de comandos da CLI: [`openclaw onboard`](/pt-BR/cli/onboard)
- Visão geral da integração: [Visão Geral da Integração](/pt-BR/start/onboarding-overview)
- Integração do app macOS: [Integração](/pt-BR/start/onboarding)
- Ritual de primeira execução do agente: [Bootstrap do Agente](/pt-BR/start/bootstrapping)
