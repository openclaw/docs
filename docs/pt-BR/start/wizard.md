---
read_when:
    - Executando ou configurando a integração pela CLI
    - Configurando uma nova máquina
sidebarTitle: 'Onboarding: CLI'
summary: 'Onboarding da CLI: configuração guiada para Gateway, workspace, canais e skills'
title: Integração inicial (CLI)
x-i18n:
    generated_at: "2026-06-27T18:13:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77bbf3d1f953ea2fca148090377f9537b00b657b2d7201c21aea902800815fd2
    source_path: start/wizard.md
    workflow: 16
---

A integração via CLI é o caminho **recomendado** de configuração pelo terminal para o OpenClaw no
macOS, Linux ou Windows. Usuários de desktop no Windows também podem começar pelo
[Windows Hub](/pt-BR/platforms/windows).
Ela configura um Gateway local ou uma conexão com Gateway remoto, além de canais, skills
e padrões do workspace em um único fluxo guiado.

```bash
openclaw onboard
```

## Localidade

O assistente da CLI localiza os textos fixos da integração. Ele resolve a localidade a partir de
`OPENCLAW_LOCALE`, depois `LC_ALL`, depois `LC_MESSAGES`, depois `LANG`, e recai
para inglês. As localidades compatíveis do assistente são `en`, `zh-CN` e `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Nomes e identificadores estáveis permanecem literais: `OpenClaw`, `Gateway`, `Tailscale`,
comandos, chaves de configuração, URLs, IDs de provedores, IDs de modelos e rótulos de plugin/canal
não são traduzidos.

<Info>
Primeiro chat mais rápido: abra a Interface de Controle (sem necessidade de configurar canal). Execute
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
A integração via CLI inclui uma etapa de pesquisa na web em que você pode escolher um provedor
como Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG ou Tavily. Alguns provedores exigem uma
chave de API, enquanto outros não exigem chave. Você também pode configurar isso depois com
`openclaw configure --section web`. Documentação: [Ferramentas web](/pt-BR/tools/web).
</Tip>

## QuickStart vs Avançado

A integração começa com **QuickStart** (padrões) vs **Avançado** (controle total).

<Tabs>
  <Tab title="QuickStart (padrões)">
    - Gateway local (loopback)
    - Padrão do workspace (ou workspace existente)
    - Porta do Gateway **18789**
    - Autenticação do Gateway **Token** (gerado automaticamente, mesmo em loopback)
    - Padrão de política de ferramentas para novas configurações locais: `tools.profile: "coding"` (perfil explícito existente é preservado)
    - Padrão de isolamento de DM: a integração local grava `session.dmScope: "per-channel-peer"` quando não definido. Detalhes: [Referência de Configuração da CLI](/pt-BR/start/wizard-cli-reference#outputs-and-internals)
    - Exposição via Tailscale **Desativada**
    - DMs do Telegram + WhatsApp usam **allowlist** por padrão (você será solicitado a informar seu número de telefone)

  </Tab>
  <Tab title="Avançado (controle total)">
    - Expõe todas as etapas (modo, workspace, gateway, canais, daemon, skills).

  </Tab>
</Tabs>

## O que a integração configura

O **modo local (padrão)** orienta você por estas etapas:

1. **Modelo/Autenticação** — escolha qualquer provedor/fluxo de autenticação compatível (chave de API, OAuth ou autenticação manual específica do provedor), incluindo Provedor Personalizado
   (compatível com OpenAI, compatível com Anthropic ou detecção automática Desconhecido). Escolha um modelo padrão.
   Nota de segurança: se este agente for executar ferramentas ou processar conteúdo de webhook/hooks, prefira o modelo de geração mais recente e mais forte disponível e mantenha a política de ferramentas restrita. Camadas mais fracas/antigas são mais fáceis de sofrer injeção de prompt.
   Para execuções não interativas, `--secret-input-mode ref` armazena referências baseadas em env nos perfis de autenticação em vez de valores de chave de API em texto simples.
   No modo não interativo `ref`, a variável de ambiente do provedor deve estar definida; passar flags de chave inline sem essa variável de ambiente falha rapidamente.
   Em execuções interativas, escolher o modo de referência secreta permite apontar para uma variável de ambiente ou uma referência de provedor configurada (`file` ou `exec`), com validação prévia rápida antes de salvar.
   Para Anthropic, a integração/configuração interativa oferece **Anthropic Claude CLI** como o caminho local preferencial e **chave de API da Anthropic** como o caminho recomendado para produção. Anthropic setup-token também continua disponível como um caminho de autenticação por token compatível.
2. **Workspace** — Local dos arquivos do agente (padrão `~/.openclaw/workspace`). Semeia arquivos de bootstrap.
3. **Gateway** — Porta, endereço de bind, modo de autenticação, exposição via Tailscale.
   No modo interativo por token, escolha o armazenamento padrão do token em texto simples ou opte por SecretRef.
   Caminho SecretRef de token não interativo: `--gateway-token-ref-env <ENV_VAR>`.
4. **Canais** — canais de chat integrados e de Plugins oficiais, como iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp e outros.
5. **Daemon** — Instala um LaunchAgent (macOS), unidade de usuário systemd (Linux/WSL2) ou Tarefa Agendada nativa do Windows com fallback por usuário na pasta Inicializar.
   Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação do daemon o valida, mas não persiste o token resolvido nos metadados de ambiente do serviço supervisor.
   Se a autenticação por token exigir um token e o SecretRef de token configurado não puder ser resolvido, a instalação do daemon será bloqueada com orientação acionável.
   Se tanto `gateway.auth.token` quanto `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação do daemon será bloqueada até que o modo seja definido explicitamente.
6. **Verificação de integridade** — Inicia o Gateway e verifica se ele está em execução.
7. **Skills** — Instala skills recomendadas e dependências opcionais.

<Note>
Executar a integração novamente **não** apaga nada, a menos que você escolha explicitamente **Redefinir** (ou passe `--reset`).
CLI `--reset` usa por padrão configuração, credenciais e sessões; use `--reset-scope full` para incluir o workspace.
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

Observações:

- Workspaces padrão seguem `~/.openclaw/workspace-<agentId>`.
- Adicione `bindings` para rotear mensagens de entrada (a integração pode fazer isso).
- Flags não interativas: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Referência completa

Para detalhamentos passo a passo e saídas de configuração, consulte
[Referência de Configuração da CLI](/pt-BR/start/wizard-cli-reference).
Para exemplos não interativos, consulte [Automação da CLI](/pt-BR/start/wizard-cli-automation).
Para a referência técnica mais aprofundada, incluindo detalhes de RPC, consulte
[Referência de Integração](/pt-BR/reference/wizard).

## Documentos relacionados

- Referência de comandos da CLI: [`openclaw onboard`](/pt-BR/cli/onboard)
- Visão geral da integração: [Visão Geral da Integração](/pt-BR/start/onboarding-overview)
- Integração no app macOS: [Integração](/pt-BR/start/onboarding)
- Ritual de primeira execução do agente: [Bootstrap do Agente](/pt-BR/start/bootstrapping)
