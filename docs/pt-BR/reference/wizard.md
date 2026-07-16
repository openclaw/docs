---
read_when:
    - Consultando uma etapa ou flag específica de integração
    - Automatização da integração com o modo não interativo
    - Depuração do comportamento de integração
sidebarTitle: Onboarding Reference
summary: 'Referência completa para a integração pela CLI: todas as etapas, flags e campos de configuração'
title: Referência de integração inicial
x-i18n:
    generated_at: "2026-07-16T12:55:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6c345887da0102c73f72623105d052ea9262006206dd70bae8f94aad1349423d
    source_path: reference/wizard.md
    workflow: 16
---

Esta é a referência completa de `openclaw onboard`.
Para uma visão geral de alto nível, consulte [Integração inicial (CLI)](/pt-BR/start/wizard). Para ver o comportamento e as saídas
passo a passo, consulte a [Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference).

## Detalhes do fluxo (modo local)

<Steps>
  <Step title="Redefinição (opcional)">
    - `--reset` redefine o estado antes da execução da configuração; sem essa opção, executar novamente a integração inicial
      mantém a configuração existente e a reutiliza como valores padrão.
    - `--reset-scope` controla o que `--reset` remove: `config` (somente o arquivo de
      configuração), `config+creds+sessions` (padrão) ou `full` (também remove o
      espaço de trabalho).
    - Se o arquivo de configuração for inválido, a integração inicial será interrompida e solicitará que
      `openclaw doctor` seja executado primeiro e, depois, que a configuração seja executada novamente.
    - A redefinição move o estado para a Lixeira (nunca o exclui diretamente).

  </Step>
  <Step title="Confirmação dos riscos">
    - A primeira execução (ou qualquer execução antes de `wizard.securityAcknowledgedAt` ser definido)
      solicita a confirmação de que você entende que os agentes são poderosos e que o acesso
      total ao sistema é arriscado.
    - `--non-interactive` exige explicitamente `--accept-risk`; sem essa opção,
      a integração inicial é encerrada com um erro, em vez de exibir uma solicitação.
    - Execuções interativas exibem uma solicitação de confirmação em vez da opção; a recusa
      cancela a configuração.

  </Step>
  <Step title="Modelo/autenticação">
    - **Chave de API da Anthropic**: usa `ANTHROPIC_API_KEY` se estiver presente ou solicita uma chave e, em seguida, a salva para uso pelo daemon.
    - **CLI do Anthropic Claude**: caminho local preferencial quando já existe uma sessão iniciada na CLI do Claude; o OpenClaw ainda oferece suporte à autenticação por token de configuração da Anthropic como alternativa.
    - **Assinatura do OpenAI Code (Codex) (OAuth)**: fluxo pelo navegador; cole o `code#state`.
      - Em uma configuração nova sem modelo principal, define `agents.defaults.model` como `openai/gpt-5.6-sol` por meio do runtime do Codex.
    - **Assinatura do OpenAI Code (Codex) (pareamento de dispositivo)**: fluxo de pareamento pelo navegador com um código de dispositivo de curta duração.
      - Em uma configuração nova sem modelo principal, define `agents.defaults.model` como `openai/gpt-5.6-sol` por meio do runtime do Codex.
    - **Chave de API da OpenAI**: usa `OPENAI_API_KEY` se estiver presente ou solicita uma chave e, em seguida, a armazena nos perfis de autenticação.
      - Em uma configuração nova sem modelo principal, define `agents.defaults.model` como `openai/gpt-5.6`; o ID simples do modelo da API direta é resolvido para o nível Sol.
    - Adicionar ou autenticar novamente a OpenAI preserva um modelo principal explícito existente, incluindo `openai/gpt-5.5`. Se a conta não disponibilizar o GPT-5.6, selecione `openai/gpt-5.5` explicitamente; o OpenClaw não rebaixa o modelo silenciosamente.
    - **OAuth da xAI**: início de sessão pelo navegador com código de dispositivo, sem necessidade de callback no localhost; portanto, também funciona por SSH/Docker/VPS (`--auth-choice xai-oauth`).
    - **Chave de API da xAI**: solicita `XAI_API_KEY` (`--auth-choice xai-api-key`).
    - `--auth-choice xai-device-code` ainda funciona como um alias de compatibilidade exclusivamente manual para o mesmo fluxo OAuth da xAI com código de dispositivo; use `xai-oauth` em novos scripts.
    - **OpenCode**: solicita `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`; obtenha-o em https://opencode.ai/auth) e permite selecionar o catálogo Zen ou Go.
    - **Ollama**: oferece primeiro **Nuvem + local**, **Somente nuvem** ou **Somente local**. `Cloud only` solicita `OLLAMA_API_KEY` e usa `https://ollama.com`; os modos com host solicitam a URL base do Ollama (padrão: `http://127.0.0.1:11434`), descobrem os modelos disponíveis e baixam automaticamente o modelo local selecionado quando necessário; `Cloud + Local` também verifica se há uma sessão iniciada nesse host do Ollama para acesso à nuvem.
    - Mais detalhes: [Ollama](/pt-BR/providers/ollama)
    - **Chave de API**: armazena a chave para você.
    - **Vercel AI Gateway (proxy multimodelo)**: solicita `AI_GATEWAY_API_KEY`.
    - Mais detalhes: [Vercel AI Gateway](/pt-BR/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: solicita o ID da conta, o ID do Gateway e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Mais detalhes: [Cloudflare AI Gateway](/pt-BR/providers/cloudflare-ai-gateway)
    - **MiniMax**: a configuração é gravada automaticamente; o padrão hospedado é `MiniMax-M3`.
      A configuração por chave de API usa `minimax/...`, e a configuração por OAuth usa
      `minimax-portal/...`.
    - Mais detalhes: [MiniMax](/pt-BR/providers/minimax)
    - **StepFun**: a configuração é gravada automaticamente para o StepFun padrão ou o Step Plan nos endpoints da China ou globais.
    - Atualmente, o padrão usa `step-3.5-flash` por padrão; o Step Plan também inclui `step-3.5-flash-2603`.
    - Mais detalhes: [StepFun](/pt-BR/providers/stepfun)
    - **Synthetic (compatível com Anthropic)**: solicita `SYNTHETIC_API_KEY`.
    - Mais detalhes: [Synthetic](/pt-BR/providers/synthetic)
    - **Moonshot (Kimi K2)**: a configuração é gravada automaticamente.
    - **Kimi Coding**: a configuração é gravada automaticamente.
    - Mais detalhes: [Moonshot AI (Kimi + Kimi Coding)](/pt-BR/providers/moonshot)
    - **Provedor personalizado**: funciona com endpoints compatíveis com OpenAI, OpenAI Responses ou Anthropic. Opções não interativas: `--auth-choice custom-api-key`, `--custom-base-url`, `--custom-model-id`, `--custom-api-key` (opcional; recorre a `CUSTOM_API_KEY`), `--custom-provider-id` (opcional; derivado automaticamente da URL base), `--custom-compatibility openai|openai-responses|anthropic` (padrão: `openai`), `--custom-image-input` / `--custom-text-input` (substituem a detecção inferida do modelo de visão).
    - **Ignorar**: nenhuma autenticação configurada ainda.
    - Selecione um modelo padrão entre as opções detectadas (ou informe o provedor/modelo manualmente). Para obter a melhor qualidade e reduzir o risco de injeção de prompt, escolha o modelo de última geração mais robusto disponível na sua pilha de provedores.
    - A integração inicial executa uma verificação do modelo e avisa se o modelo configurado for desconhecido ou não tiver autenticação.
    - O modo de armazenamento de chaves de API usa, por padrão, valores em texto simples no perfil de autenticação. Use `--secret-input-mode ref` para armazenar referências baseadas em variáveis de ambiente (por exemplo, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`); a variável de ambiente referenciada já deve estar definida, caso contrário a integração inicial falhará imediatamente.
    - Os perfis de autenticação ficam em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (chaves de API + OAuth). `~/.openclaw/credentials/oauth.json` serve somente para importação legada.
    - Mais detalhes: [OAuth](/pt-BR/concepts/oauth)
    <Note>
    Dica para servidores/ambientes sem interface gráfica: conclua o OAuth em uma máquina com navegador e depois copie
    o `auth-profiles.json` desse agente (por exemplo,
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` ou o caminho
    `$OPENCLAW_STATE_DIR/...` correspondente) para o host do Gateway. `credentials/oauth.json`
    é apenas uma origem de importação legada.
    </Note>
  </Step>
  <Step title="Espaço de trabalho">
    - O padrão é `~/.openclaw/workspace` (configurável).
    - Cria os arquivos do espaço de trabalho necessários para o ritual de inicialização do agente.
    - Layout completo do espaço de trabalho + guia de backup: [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Porta (padrão: **18789**), vinculação, modo de autenticação e exposição pelo Tailscale.
    - Recomendação de autenticação: mantenha **Token** mesmo para loopback, para que os clientes WS locais precisem se autenticar.
    - No modo de token, a configuração interativa oferece:
      - **Gerar/armazenar token em texto simples** (padrão)
      - **Usar SecretRef** (opcional)
      - O início rápido reutiliza SecretRefs existentes de `gateway.auth.token` entre os provedores `env`, `file` e `exec` para a sondagem da integração inicial/inicialização do painel.
      - Se essa SecretRef estiver configurada, mas não puder ser resolvida, a integração inicial falhará antecipadamente com uma mensagem clara de correção, em vez de degradar silenciosamente a autenticação do runtime.
    - No modo de senha, a configuração interativa também oferece suporte ao armazenamento em texto simples ou com SecretRef.
    - Caminho não interativo de SecretRef do token: `--gateway-token-ref-env <ENV_VAR>`.
      - Exige uma variável de ambiente não vazia no ambiente do processo de integração inicial.
      - Não pode ser combinado com `--gateway-token`.
    - Desative a autenticação somente se confiar plenamente em todos os processos locais.
    - Vinculações que não sejam de loopback ainda exigem autenticação.

  </Step>
  <Step title="Canais">
    - [WhatsApp](/pt-BR/channels/whatsapp): login opcional por código QR.
    - [Telegram](/pt-BR/channels/telegram): token do bot.
    - [Discord](/pt-BR/channels/discord): token do bot.
    - [Google Chat](/pt-BR/channels/googlechat): JSON da conta de serviço + público do Webhook.
    - [Mattermost](/pt-BR/channels/mattermost) (plugin): token do bot + URL base.
    - [Signal](/pt-BR/channels/signal) (plugin): instalação opcional de `signal-cli` + configuração da conta.
    - [iMessage](/pt-BR/channels/imessage): caminho da CLI `imsg` + acesso ao banco de dados do Mensagens; use um wrapper SSH quando o Gateway for executado fora de um Mac.
    - Discord, Feishu, Microsoft Teams, QQ Bot, Slack e outros canais são fornecidos como
      plugins que a integração inicial pode instalar para você. Catálogo completo: [Canais](/pt-BR/channels).
    - Segurança de mensagens diretas: o padrão é o pareamento. A primeira mensagem direta envia um código; aprove-o por meio de `openclaw pairing approve <channel> <code>` ou use listas de permissões.

  </Step>
  <Step title="Pesquisa na web">
    - Selecione um provedor compatível, como Brave, Codex (pesquisa hospedada), DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Parallel, Perplexity, SearXNG ou Tavily (ou ignore).
    - Provedores baseados em API podem usar variáveis de ambiente ou a configuração existente para uma configuração rápida; provedores sem chave usam os próprios pré-requisitos específicos.
    - Ignore com `--skip-search`.
    - Configure mais tarde: `openclaw configure --section web`.

  </Step>
  <Step title="Instalação do daemon">
    - macOS: LaunchAgent
      - Exige uma sessão de usuário conectada; para ambientes sem interface gráfica, use um LaunchDaemon personalizado (não fornecido).
    - Linux (e Windows por meio do WSL2): unidade de usuário do systemd
      - A integração inicial tenta habilitar a persistência por meio de `loginctl enable-linger <user>` para que o Gateway permaneça ativo após o logout.
      - Pode solicitar sudo (grava em `/var/lib/systemd/linger`); primeiro, tenta sem sudo.
    - Windows nativo: primeiro, uma Tarefa Agendada; se a criação da tarefa for negada, o OpenClaw recorrerá a um item de login por usuário na pasta Inicializar e iniciará o Gateway imediatamente.
    - **Seleção do runtime:** o Node é obrigatório porque o armazenamento canônico do estado do runtime usa `node:sqlite`. Serviços legados do Bun são migrados para o Node durante o reparo.
    - Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação do daemon o validará, mas não persistirá valores resolvidos do token em texto simples nos metadados de ambiente do serviço supervisor.
    - Se a autenticação por token exigir um token e a SecretRef do token configurada não for resolvida, a instalação do daemon será bloqueada com orientações práticas.
    - Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação do daemon será bloqueada até que o modo seja definido explicitamente.

  </Step>
  <Step title="Verificação de integridade">
    - Inicia o Gateway (se necessário) e executa `openclaw health`.
    - Dica: `openclaw status --deep` adiciona a sondagem de integridade do Gateway em tempo real à saída de status, incluindo sondagens de canais quando houver suporte (exige um Gateway acessível).

  </Step>
  <Step title="Skills (recomendadas)">
    - Lê as Skills disponíveis e verifica os requisitos.
    - Permite selecionar um gerenciador de Node: **npm / pnpm / bun**.
    - Instala automaticamente dependências opcionais de Skills integradas confiáveis (algumas usam o Homebrew no macOS).
    - Ignora Skills cujo pré-requisito de instalação do Homebrew, uv ou Go não esteja disponível, agrupa-as com orientações de configuração manual e direciona para `openclaw doctor` após a instalação do pré-requisito.

  </Step>
  <Step title="Conclusão">
    - Resumo + próximas etapas, incluindo a solicitação **Como você deseja iniciar seu agente?** para Terminal, Navegador ou mais tarde.

  </Step>
</Steps>

<Note>
Se nenhuma GUI for detectada, a integração inicial exibirá instruções de encaminhamento de porta SSH para a Control UI, em vez de abrir um navegador.
Se os recursos da Control UI estiverem ausentes, a integração inicial tentará compilá-los; a alternativa é `pnpm ui:build` (instala automaticamente as dependências da interface).
</Note>

## Modo não interativo

Use `--non-interactive --accept-risk` para automatizar ou criar scripts para a integração inicial (a
flag é a confirmação de risco obrigatória; a integração inicial termina com um erro
sem ela):

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Adicione `--json` para obter um resumo legível por máquina.

SecretRef do token do Gateway no modo não interativo:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` e `--gateway-token-ref-env` são mutuamente exclusivos.

<Note>
`--json` **não** implica o modo não interativo. Use `--non-interactive --accept-risk` (e `--workspace`) para scripts.
</Note>

Exemplos de comandos específicos de provedores estão em [Automação da CLI](/pt-BR/start/wizard-cli-automation#provider-specific-examples).
Use esta página de referência para consultar a semântica das flags e a ordem das etapas.

### Adicionar agente (não interativo)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

`main` é um ID de agente reservado e não pode ser usado para `openclaw agents add`.

## RPC do assistente do Gateway

O Gateway disponibiliza o fluxo de integração inicial por RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Os clientes (aplicativo para macOS, Control UI) podem renderizar as etapas sem reimplementar a lógica da integração inicial.

## Configuração do Signal (signal-cli)

A integração inicial detecta se `signal-cli` está em `PATH` e, caso esteja ausente, oferece a opção de instalá-lo:

- Linux x86-64: baixa a compilação nativa oficial do GraalVM das versões do GitHub de `signal-cli` e a armazena em `~/.openclaw/tools/signal-cli/<version>/`.
- macOS e outras arquiteturas: instala via Homebrew.
- Windows nativo: ainda não é compatível; execute a integração inicial no WSL2 para usar o caminho de instalação do Linux.
- Grava `channels.signal.cliPath` na configuração em ambos os casos.

## O que o assistente grava

Campos típicos em `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` quando `--skip-bootstrap` é fornecido
- `agents.defaults.model` / `models.providers` (se o Minimax for escolhido)
- `tools.profile` (a integração inicial local usa `"coding"` por padrão quando não definido; valores explícitos existentes são preservados)
- `gateway.*` (modo, vinculação, autenticação, Tailscale)
- `session.dmScope` (a integração inicial local usa `"per-channel-peer"` por padrão quando não definido; valores explícitos existentes são preservados. Detalhes: [Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas de permissões de mensagens diretas dos canais quando você adere durante as solicitações dos canais. Discord, Matrix, Microsoft Teams e Slack resolvem nomes em IDs quando possível; outros canais recebem IDs diretamente (por exemplo, IDs numéricos de remetentes do Telegram ou números de telefone do WhatsApp).
- `skills.install.nodeManager`
  - `setup --node-manager` aceita `npm`, `pnpm` ou `bun`.
  - A configuração manual ainda pode usar `yarn`, definindo `skills.install.nodeManager` diretamente.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` grava `agents.list[]` e, opcionalmente, `bindings`.

As credenciais do WhatsApp ficam em `~/.openclaw/credentials/whatsapp/<accountId>/`.
As sessões ativas e as transcrições são armazenadas em
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. O diretório
`~/.openclaw/agents/<agentId>/sessions/` é usado para entradas de migração legadas
e artefatos de arquivamento/suporte.

Alguns canais são fornecidos como plugins. Ao escolher um deles durante a configuração, a integração inicial
solicitará que ele seja instalado (npm ou um caminho local) antes que possa ser configurado.

## Documentação relacionada

- Visão geral da integração inicial: [Integração inicial (CLI)](/pt-BR/start/wizard)
- Referência de configuração da CLI: [Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference)
- Integração inicial do aplicativo para macOS: [Integração inicial](/pt-BR/start/onboarding)
- Referência de configuração: [Configuração do Gateway](/pt-BR/gateway/configuration)
- Provedores: [WhatsApp](/pt-BR/channels/whatsapp), [Telegram](/pt-BR/channels/telegram), [Discord](/pt-BR/channels/discord), [Google Chat](/pt-BR/channels/googlechat), [Signal](/pt-BR/channels/signal), [iMessage](/pt-BR/channels/imessage)
- Skills: [Skills](/pt-BR/tools/skills), [Configuração de Skills](/pt-BR/tools/skills-config)
