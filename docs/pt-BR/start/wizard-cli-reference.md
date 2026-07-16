---
read_when:
    - Você precisa de informações detalhadas sobre o comportamento de uma etapa específica de `openclaw onboard`
    - Você está depurando os resultados da integração inicial ou integrando clientes de integração inicial
sidebarTitle: CLI reference
summary: 'Comportamento passo a passo do `openclaw onboard`: o que cada etapa faz, a configuração que grava e os detalhes internos'
title: Referência de configuração da CLI
x-i18n:
    generated_at: "2026-07-16T13:01:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 96c1469c6b64f08fd9105c8b737df164d39d27d051bbb9bb4f76b9e1e057785d
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Esta página aborda o comportamento, as saídas e os componentes internos da integração inicial passo a passo.
Para ver um passo a passo, consulte [Integração inicial (CLI)](/pt-BR/start/wizard). Para obter a referência completa de flags da CLI
(cada `--flag`, exemplos não interativos, comandos específicos de
provedores), consulte [`openclaw onboard`](/pt-BR/cli/onboard).

## O que o assistente faz

O modo local (padrão) orienta você por:

- Configuração de modelo e autenticação (Anthropic, OAuth da assinatura OpenAI Code, xAI, OpenCode, endpoints personalizados e outros fluxos de autenticação pertencentes aos provedores)
- Local do espaço de trabalho e arquivos de inicialização
- Configurações do Gateway (porta, vinculação, autenticação, Tailscale)
- Canais e provedores (Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp e outros canais incluídos ou de plugins)
- Provedor de pesquisa na web (opcional)
- Instalação do daemon (LaunchAgent, unidade de usuário systemd ou Tarefa Agendada nativa do Windows com alternativa pela pasta Inicializar)
- Verificação de integridade
- Configuração de Skills

O modo remoto configura esta máquina para se conectar a um Gateway localizado em outro lugar. Ele
não instala nem modifica nada no host remoto.

## Detalhes do fluxo local

<Steps>
  <Step title="Detecção de configuração existente">
    - Se `~/.openclaw/openclaw.json` existir, escolha **Manter valores atuais**, **Revisar e atualizar** ou **Redefinir antes da configuração**.
    - Executar o assistente novamente não apaga nada, a menos que você escolha explicitamente Redefinir (ou passe `--reset`).
    - O `--reset` da CLI usa `config+creds+sessions` por padrão; use `--reset-scope full` para também remover o espaço de trabalho.
    - Se a configuração for inválida ou contiver chaves legadas, o assistente será interrompido e solicitará que você execute `openclaw doctor` antes de continuar.
    - A redefinição move o estado para a Lixeira (nunca o exclui diretamente) e oferece os seguintes escopos:
      - Somente configuração
      - Configuração + credenciais + sessões
      - Redefinição completa (também remove o espaço de trabalho)

  </Step>
  <Step title="Modelo e autenticação">
    - A matriz completa de opções está em [Opções de autenticação e modelo](#auth-and-model-options).

  </Step>
  <Step title="Espaço de trabalho">
    - Padrão: `~/.openclaw/workspace` (configurável).
    - Cria os arquivos do espaço de trabalho necessários para a inicialização da primeira execução.
    - Layout do espaço de trabalho: [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Solicita porta, vinculação, modo de autenticação e exposição pelo Tailscale.
    - Recomendação: mantenha a autenticação por token ativada mesmo para loopback, para que os clientes WS locais precisem se autenticar.
    - No modo de token, a configuração interativa oferece:
      - **Gerar/armazenar token em texto simples** (padrão)
      - **Usar SecretRef** (adesão opcional)
    - No modo de senha, a configuração interativa também permite armazenamento em texto simples ou SecretRef.
    - Caminho não interativo para SecretRef do token: `--gateway-token-ref-env <ENV_VAR>`.
      - Requer uma variável de ambiente não vazia no ambiente do processo de integração inicial.
      - Não pode ser combinado com `--gateway-token`.
    - Desative a autenticação somente se confiar plenamente em todos os processos locais.
    - Vinculações que não sejam de loopback ainda exigem autenticação.

  </Step>
  <Step title="Canais">
    - [WhatsApp](/pt-BR/channels/whatsapp): login opcional por QR code
    - [Telegram](/pt-BR/channels/telegram): token do bot
    - [Discord](/pt-BR/channels/discord): token do bot
    - [Google Chat](/pt-BR/channels/googlechat): JSON da conta de serviço + público-alvo do webhook
    - [Mattermost](/pt-BR/channels/mattermost): token do bot + URL base
    - [Signal](/pt-BR/channels/signal): instalação opcional do `signal-cli` + configuração da conta
    - [iMessage](/pt-BR/channels/imessage): caminho da CLI `imsg` + acesso ao banco de dados do Mensagens; use um wrapper SSH quando o Gateway for executado fora de um Mac
    - Segurança de mensagens diretas: o padrão é o pareamento. A primeira mensagem direta envia um código; aprove por meio de
      `openclaw pairing approve <channel> <code>` ou use listas de permissões.
  </Step>
  <Step title="Pesquisa na web">
    - Escolha um provedor (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily) ou pule.
    - Pule esta etapa com `--skip-search`; reconfigure posteriormente com `openclaw configure --section web`.

  </Step>
  <Step title="Instalação do daemon">
    - macOS: LaunchAgent
      - Requer uma sessão de usuário iniciada; para execução sem interface, use um LaunchDaemon personalizado (não fornecido).
    - Linux e Windows via WSL2: unidade de usuário systemd
      - O assistente tenta executar `loginctl enable-linger <user>` para que o Gateway permaneça ativo após o logout.
      - Pode solicitar sudo (grava em `/var/lib/systemd/linger`); primeiro, tenta sem sudo.
    - Windows nativo: Tarefa Agendada primeiro
      - Se a criação da tarefa for negada, o OpenClaw recorrerá a um item de login por usuário na pasta Inicializar e iniciará o Gateway imediatamente.
      - As Tarefas Agendadas continuam sendo preferidas porque fornecem um status melhor do supervisor.
    - Seleção do ambiente de execução: o Node é obrigatório porque o armazenamento canônico do estado de execução do OpenClaw usa `node:sqlite`.

  </Step>
  <Step title="Verificação de integridade">
    - Inicia o Gateway (se necessário) e executa `openclaw health`.
    - `openclaw status --deep` adiciona a sondagem de integridade do Gateway ativo à saída de status, incluindo sondagens de canais quando houver suporte.

  </Step>
  <Step title="Skills">
    - Lê as Skills disponíveis e verifica os requisitos.
    - Permite escolher o gerenciador de Node: npm, pnpm ou bun.
    - Instala dependências opcionais para Skills incluídas confiáveis quando o
      instalador necessário está disponível.
    - Ignora instaladores indisponíveis do Homebrew, uv e Go e, em seguida, agrupa as
      Skills afetadas com orientações para configuração manual. Execute `openclaw doctor` após instalar
      os pré-requisitos ausentes.

  </Step>
  <Step title="Conclusão">
    - Resumo e próximas etapas, incluindo opções de aplicativos para iOS, Android e macOS.

  </Step>
</Steps>

<Note>
Se nenhuma GUI for detectada, o assistente exibirá instruções de encaminhamento de porta SSH para a interface de controle, em vez de abrir um navegador.
Se os recursos da interface de controle estiverem ausentes, o assistente tentará compilá-los; a alternativa é `pnpm ui:build` (instala automaticamente as dependências da interface).
</Note>

## Detalhes do modo remoto

O modo remoto configura esta máquina para se conectar a um Gateway localizado em outro lugar. Ele
não instala nem modifica nada no host remoto.

O que é configurado:

- URL do Gateway remoto (`ws://...` ou `wss://...`)
- Token, senha ou nenhuma autenticação, de acordo com a configuração do Gateway remoto

<Steps>
  <Step title="Descoberta (opcional)">
    Se `dns-sd` (macOS) ou `avahi-browse` (Linux) estiver disponível, a integração inicial
    oferecerá a busca por beacons de Gateway do Bonjour/mDNS antes de recorrer à
    inserção manual da URL. A descoberta DNS-SD de longa distância também será tentada quando
    estiver configurada. Documentação: [Descoberta de Gateway](/pt-BR/gateway/discovery), [Bonjour](/pt-BR/gateway/bonjour).
  </Step>
  <Step title="Método de conexão">
    Quando um beacon for selecionado, escolha WebSocket direto ou um túnel SSH:
    - **Direto**: conecta-se por `wss://` e solicita que você confie na impressão digital
      TLS descoberta (fixação baseada em confiança no primeiro uso; fixada somente se você aceitar).
    - **Túnel SSH**: exibe um comando `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
      para executar primeiro e, em seguida, conecta-se ao endpoint do túnel local.
  </Step>
  <Step title="Autenticação">
    Escolha token (recomendado), senha ou nenhuma autenticação e, opcionalmente, armazene a opção
    como SecretRef em vez de texto simples.
  </Step>
</Steps>

<Note>
Se o Gateway aceitar somente loopback e não puder ser descoberto, use manualmente um túnel SSH ou uma tailnet.
`ws://` em texto simples é aceito para loopback, literais de IP privado, `.local` e URLs `*.ts.net` da Tailnet; outros nomes DNS privados precisam de `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`.
</Note>

## Opções de autenticação e modelo

Se uma etapa de configuração do provedor falhar durante a integração inicial interativa (por exemplo, uma opção de reutilização da CLI
sem um login local), o assistente exibirá o erro e retornará ao seletor de provedores,
em vez de encerrar. Execuções explícitas de `--auth-choice` ainda falham imediatamente para fins de automação.

<AccordionGroup>
  <Accordion title="Chave de API da Anthropic">
    Usa `ANTHROPIC_API_KEY` se estiver presente ou solicita uma chave e, em seguida, salva-a para uso pelo daemon.
  </Accordion>
  <Accordion title="CLI do Anthropic Claude">
    Caminho local preferencial na integração inicial/configuração interativa; reutiliza um login existente da CLI do Claude quando disponível.
  </Accordion>
  <Accordion title="Assinatura OpenAI Code (OAuth)">
    Fluxo no navegador; cole `code#state`.

    Em uma configuração nova sem modelo principal, define `agents.defaults.model` como
    `openai/gpt-5.6-sol` por meio do ambiente de execução Codex.

  </Accordion>
  <Accordion title="Assinatura OpenAI Code (pareamento de dispositivo)">
    Fluxo de pareamento no navegador com um código de dispositivo de curta duração.

    Em uma configuração nova sem modelo principal, define `agents.defaults.model` como
    `openai/gpt-5.6-sol` por meio do ambiente de execução Codex.

  </Accordion>
  <Accordion title="Chave de API da OpenAI">
    Usa `OPENAI_API_KEY` se estiver presente ou solicita uma chave e, em seguida, armazena a credencial nos perfis de autenticação.

    Em uma configuração nova sem modelo principal, define `agents.defaults.model` como
    `openai/gpt-5.6`; o ID de modelo simples da API direta é resolvido para a categoria Sol.

    Adicionar ou autenticar novamente a OpenAI preserva um modelo principal explícito
    existente, incluindo `openai/gpt-5.5`. Se a conta não disponibilizar o GPT-5.6,
    selecione `openai/gpt-5.5` explicitamente; o OpenClaw não faz downgrade silencioso.

  </Accordion>
  <Accordion title="OAuth da xAI (Grok)">
    Login pelo navegador para contas SuperGrok ou X Premium elegíveis. Este é o
    método recomendado da xAI para a maioria dos usuários. O OpenClaw armazena o perfil de
    autenticação resultante para modelos Grok, Grok `web_search`, `x_search` e `code_execution`.
  </Accordion>
  <Accordion title="Código de dispositivo da xAI (Grok)">
    Login pelo navegador adequado para ambientes remotos, usando um código curto em vez de um
    callback de localhost. Use em hosts SSH, Docker ou VPS.
  </Accordion>
  <Accordion title="Chave de API da xAI (Grok)">
    Solicita `XAI_API_KEY` e configura a xAI como provedora de modelos. Use
    quando quiser uma chave de API do xAI Console em vez do OAuth da assinatura.
  </Accordion>
  <Accordion title="OpenCode">
    Solicita `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`) e permite escolher o catálogo Zen ou Go (uma chave de API abrange ambos).
    URL de configuração: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Chave de API (genérica)">
    Armazena a chave para você.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Solicita `AI_GATEWAY_API_KEY`.
    Mais detalhes: [Vercel AI Gateway](/pt-BR/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Solicita o ID da conta, o ID do gateway e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Mais detalhes: [Cloudflare AI Gateway](/pt-BR/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    A configuração é gravada automaticamente. O padrão hospedado é `MiniMax-M3`; a configuração com chave de API usa
    `minimax/...`, e a configuração com OAuth usa `minimax-portal/...`.
    Mais detalhes: [MiniMax](/pt-BR/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    A configuração é gravada automaticamente para o StepFun padrão ou o Step Plan em endpoints da China ou globais.
    Atualmente, o plano padrão inclui `step-3.5-flash`, e o Step Plan também inclui `step-3.5-flash-2603`.
    Mais detalhes: [StepFun](/pt-BR/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatível com Anthropic)">
    Solicita `SYNTHETIC_API_KEY`.
    Mais detalhes: [Synthetic](/pt-BR/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (modelos abertos na nuvem e locais)">
    Primeiro, solicita `Cloud + Local`, `Cloud only` ou `Local only`.
    `Cloud only` usa `OLLAMA_API_KEY` com `https://ollama.com`.
    Os modos baseados em host solicitam a URL base (padrão: `http://127.0.0.1:11434`), descobrem os modelos disponíveis e sugerem padrões.
    `Cloud + Local` também verifica se esse host Ollama está autenticado para acesso à nuvem.
    Mais detalhes: [Ollama](/pt-BR/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot e Kimi Coding">
    As configurações do Moonshot (Kimi K2) e do Kimi Coding são gravadas automaticamente.
    Mais detalhes: [Moonshot AI (Kimi + Kimi Coding)](/pt-BR/providers/moonshot).
  </Accordion>
  <Accordion title="Provedor personalizado">
    Funciona com endpoints compatíveis com OpenAI, OpenAI Responses e Anthropic.

    A integração interativa oferece as mesmas opções de armazenamento de chave de API que os outros fluxos de chave de API de provedores:
    - **Colar a chave de API agora** (texto simples)
    - **Usar referência de segredo** (referência de variável de ambiente ou referência de provedor configurado, com validação preliminar)

    A integração infere o suporte a imagens para IDs comuns de modelos de visão (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral e semelhantes) e só pergunta quando o nome do modelo é desconhecido.

    Flags não interativas:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcional; usa `CUSTOM_API_KEY` como alternativa)
    - `--custom-provider-id` (opcional)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (opcional; padrão: `openai`)
    - `--custom-image-input` / `--custom-text-input` (opcional; substitui a capacidade de entrada inferida do modelo)

  </Accordion>
  <Accordion title="Pular">
    Deixa a autenticação sem configuração.
  </Accordion>
</AccordionGroup>

Comportamento do modelo:

- Escolha o modelo padrão entre as opções detectadas ou informe manualmente o provedor e o modelo.
- Quando a integração começa a partir da escolha de autenticação de um provedor, o seletor de modelos dá preferência
  automaticamente a esse provedor. Para Volcengine e BytePlus, a mesma preferência
  também corresponde às variantes de planos de programação (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Se esse filtro de provedor preferencial não retornar resultados, o seletor usa
  o catálogo completo como alternativa, em vez de não exibir nenhum modelo.
- O assistente executa uma verificação do modelo e avisa se o modelo configurado é desconhecido ou não possui autenticação.

Caminhos de credenciais e perfis:

- Perfis de autenticação (chaves de API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Importação de OAuth legado: `~/.openclaw/credentials/oauth.json`

Modo de armazenamento de credenciais:

- O comportamento padrão da integração mantém as chaves de API como valores em texto simples nos perfis de autenticação.
- `--secret-input-mode ref` ativa o modo de referência em vez do armazenamento da chave em texto simples.
  Na configuração interativa, é possível escolher:
  - referência de variável de ambiente (por exemplo, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - referência de provedor configurado (`file` ou `exec`) com alias + ID do provedor
- O modo de referência interativo executa uma validação preliminar rápida antes de salvar.
  - Referências de variáveis de ambiente: valida o nome da variável + um valor não vazio no ambiente atual de integração.
  - Referências de provedores: valida a configuração do provedor e resolve o ID solicitado.
  - Se a validação preliminar falhar, a integração exibirá o erro e permitirá tentar novamente.
- No modo não interativo, `--secret-input-mode ref` é baseado somente em variável de ambiente.
  - Defina a variável de ambiente do provedor no ambiente do processo de integração.
  - Flags de chave em linha (por exemplo, `--openai-api-key`) exigem que essa variável de ambiente esteja definida; caso contrário, a integração falha imediatamente.
  - Para provedores personalizados, o modo não interativo `ref` armazena `models.providers.<id>.apiKey` como `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Nesse caso de provedor personalizado, `--custom-api-key` exige que `CUSTOM_API_KEY` esteja definido; caso contrário, a integração falha imediatamente.
- As credenciais de autenticação do Gateway permitem escolher entre texto simples e SecretRef na configuração interativa:
  - Modo de token: **Gerar/armazenar token em texto simples** (padrão) ou **Usar SecretRef**.
  - Modo de senha: texto simples ou SecretRef.
- Caminho SecretRef de token não interativo: `--gateway-token-ref-env <ENV_VAR>`.
- As configurações existentes em texto simples continuam funcionando sem alterações.

<Note>
Dica para ambientes sem interface gráfica e servidores: conclua o OAuth em uma máquina com navegador e copie
o `auth-profiles.json` desse agente (por exemplo,
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` ou o caminho
`$OPENCLAW_STATE_DIR/...` correspondente) para o host do gateway. `credentials/oauth.json`
é apenas uma fonte de importação legada.
</Note>

## Saídas e detalhes internos

Campos típicos em `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` quando `--skip-bootstrap` é fornecido
- `agents.defaults.model` / `models.providers` (se Minimax for escolhido)
- `tools.profile` (a integração local usa como padrão `"coding"` quando não definido; os valores explícitos existentes são preservados)
- `gateway.*` (modo, vínculo, autenticação, Tailscale)
- `session.dmScope` (a integração local usa como padrão `per-channel-peer` quando não definido; os valores explícitos existentes são preservados)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas de permissões de canais (Discord, iMessage, Signal, Slack, Telegram, WhatsApp) quando você aceita durante as solicitações; Discord e Slack também resolvem os nomes informados para IDs
- `skills.install.nodeManager`
  - A flag `setup --node-manager` aceita `npm`, `pnpm` ou `bun`.
  - A configuração manual ainda pode definir `skills.install.nodeManager: "yarn"` posteriormente.
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
`~/.openclaw/agents/<agentId>/sessions/` é usado para entradas de migração legada
e artefatos de arquivamento/suporte.

<Note>
Alguns canais são fornecidos como plugins. Quando selecionados durante a configuração, o assistente
solicita a instalação do plugin (npm ou caminho local) antes da configuração do canal.
</Note>

## Configuração não interativa

`--non-interactive` exige `--accept-risk` (confirma que os agentes são
poderosos e que o acesso total ao sistema é arriscado):

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY"
```

Referência completa de flags e exemplos específicos de provedores: [`openclaw onboard`](/pt-BR/cli/onboard), [Automação da CLI](/pt-BR/start/wizard-cli-automation).

## RPC do assistente do Gateway

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Os clientes (aplicativo para macOS e interface de controle) podem renderizar as etapas sem reimplementar a lógica de integração.

## Comportamento da configuração do Signal

- Baixa o artefato de versão apropriado das versões oficiais do GitHub de `signal-cli` (compilação nativa, somente Linux x86-64)
- Em outras plataformas (macOS, Linux não x64), instala pelo Homebrew
- Armazena a instalação do artefato de versão em `~/.openclaw/tools/signal-cli/<version>/`
- Grava `channels.signal.cliPath` na configuração
- O Windows nativo ainda não é compatível; execute a integração no WSL2 para obter o caminho de instalação do Linux

## Documentação relacionada

- Central de integração: [Integração (CLI)](/pt-BR/start/wizard)
- Automação e scripts: [Automação da CLI](/pt-BR/start/wizard-cli-automation)
- Referência do comando: [`openclaw onboard`](/pt-BR/cli/onboard)
