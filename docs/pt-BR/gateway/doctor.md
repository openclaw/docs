---
read_when:
    - Adicionando ou modificando migrações do doctor
    - Introduzindo alterações de configuração incompatíveis
sidebarTitle: Doctor
summary: 'Comando doctor: verificações de integridade, migrações de configuração e etapas de reparo'
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-04T09:36:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bc8615f5e49e8c20785a9dc9779c447fd0d5794c80663d2396b0a20b4187798
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` é a ferramenta de reparo + migração do OpenClaw. Ela corrige configurações/estado obsoletos, verifica a integridade e fornece etapas de reparo acionáveis.

## Início rápido

```bash
openclaw doctor
```

### Modos headless e de automação

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Aceita os padrões sem solicitar confirmação (incluindo etapas de reparo de reinicialização/serviço/sandbox quando aplicável).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Aplica os reparos recomendados sem solicitar confirmação (reparos + reinicializações quando seguro).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Aplica também reparos agressivos (sobrescreve configurações personalizadas de supervisor).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Executa sem prompts e aplica apenas migrações seguras (normalização de configuração + movimentações de estado em disco). Ignora ações de reinicialização/serviço/sandbox que exigem confirmação humana. Migrações de estado legado são executadas automaticamente quando detectadas.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Verifica serviços do sistema em busca de instalações extras do gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se quiser revisar as mudanças antes de gravar, abra o arquivo de configuração primeiro:

```bash
cat ~/.openclaw/openclaw.json
```

## O que ele faz (resumo)

<AccordionGroup>
  <Accordion title="Integridade, UI e atualizações">
    - Atualização prévia opcional para instalações via git (somente interativo).
    - Verificação de atualização do protocolo da UI (recompila a Control UI quando o schema do protocolo é mais recente).
    - Verificação de integridade + prompt de reinicialização.
    - Resumo de status de Skills (elegíveis/ausentes/bloqueadas) e status de Plugin.

  </Accordion>
  <Accordion title="Configuração e migrações">
    - Normalização de configuração para valores legados.
    - Migração da configuração do Talk de campos planos legados `talk.*` para `talk.provider` + `talk.providers.<provider>`.
    - Verificações de migração do navegador para configurações legadas da extensão do Chrome e prontidão do Chrome MCP.
    - Avisos de substituição do provedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avisos de sombreamento do OAuth do Codex (`models.providers.openai-codex`).
    - Verificação de pré-requisitos de TLS do OAuth para perfis OAuth do OpenAI Codex.
    - Avisos de lista de permissões de plugins/ferramentas quando `plugins.allow` é restritiva, mas a política de ferramentas ainda pede curingas ou ferramentas pertencentes a plugins.
    - Migração de estado legado em disco (sessions/agent dir/autenticação do WhatsApp).
    - Migração de chaves legadas de contrato de manifesto de plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migração de armazenamento Cron legado (`jobId`, `schedule.cron`, campos de entrega/payload de nível superior, payload `provider`, tarefas simples de fallback de Webhook `notify: true`).
    - Migração de política de runtime de agentes legada para `agents.defaults.agentRuntime` e `agents.list[].agentRuntime`.
    - Limpeza de configuração obsoleta de Plugin quando plugins estão habilitados; quando `plugins.enabled=false`, referências obsoletas de Plugin são tratadas como configuração inerte de contenção e são preservadas.

  </Accordion>
  <Accordion title="Estado e integridade">
    - Inspeção de arquivos de bloqueio de sessão e limpeza de bloqueios obsoletos.
    - Reparo de transcrições de sessão para branches duplicados de reescrita de prompt criados por builds 2026.4.24 afetadas.
    - Detecção de tombstone de recuperação de reinicialização de subagentes travados, com suporte a `--fix` para limpar flags obsoletas de recuperação abortada para que a inicialização não continue tratando o filho como abortado na reinicialização.
    - Verificações de integridade de estado e permissões (sessões, transcrições, diretório de estado).
    - Verificações de permissões do arquivo de configuração (chmod 600) ao executar localmente.
    - Integridade da autenticação de modelos: verifica expiração de OAuth, pode atualizar tokens prestes a expirar e informa estados de cooldown/desabilitado de perfis de autenticação.
    - Detecção de diretório extra de workspace (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, serviços e supervisores">
    - Reparo da imagem de sandbox quando o sandboxing está habilitado.
    - Migração de serviço legado e detecção de gateways extras.
    - Migração de estado legado do canal Matrix (no modo `--fix` / `--repair`).
    - Verificações de runtime do Gateway (serviço instalado, mas não em execução; rótulo launchd em cache).
    - Avisos de status de canais (sondados a partir do gateway em execução).
    - Auditoria de configuração de supervisor (launchd/systemd/schtasks) com reparo opcional.
    - Limpeza do ambiente de proxy embutido para serviços de Gateway que capturaram valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante a instalação ou atualização.
    - Verificações de boas práticas de runtime do Gateway (Node vs Bun, caminhos de gerenciadores de versão).
    - Diagnósticos de colisão de porta do Gateway (padrão `18789`).

  </Accordion>
  <Accordion title="Autenticação, segurança e pareamento">
    - Avisos de segurança para políticas de DM abertas.
    - Verificações de autenticação do Gateway para modo de token local (oferece geração de token quando não existe fonte de token; não sobrescreve configurações de SecretRef de token).
    - Detecção de problemas de pareamento de dispositivos (solicitações pendentes de primeiro pareamento, upgrades pendentes de função/escopo, divergência obsoleta do cache local de token de dispositivo e divergência de autenticação de registro pareado).

  </Accordion>
  <Accordion title="Workspace e shell">
    - Verificação de linger do systemd no Linux.
    - Verificação de tamanho do arquivo de bootstrap do workspace (avisos de truncamento/próximo do limite para arquivos de contexto).
    - Verificação de prontidão de Skills para o agente padrão; informa skills permitidas com bins, env, configuração ou requisitos de SO ausentes, e `--fix` pode desabilitar skills indisponíveis em `skills.entries`.
    - Verificação de status de conclusão do shell e instalação/upgrade automático.
    - Verificação de prontidão do provedor de embeddings de busca de memória (modelo local, chave de API remota ou binário QMD).
    - Verificações de instalação a partir do código-fonte (incompatibilidade do workspace pnpm, assets de UI ausentes, binário tsx ausente).
    - Grava configuração atualizada + metadados do assistente.

  </Accordion>
</AccordionGroup>

## Backfill e reset da UI Dreams

A cena Dreams da Control UI inclui as ações **Backfill**, **Reset** e **Clear Grounded** para o fluxo de trabalho de dreaming ancorado. Essas ações usam métodos RPC no estilo doctor do gateway, mas **não** fazem parte do reparo/migração da CLI `openclaw doctor`.

O que elas fazem:

- **Backfill** verifica arquivos históricos `memory/YYYY-MM-DD.md` no workspace ativo, executa a passagem de diário REM ancorado e grava entradas reversíveis de backfill em `DREAMS.md`.
- **Reset** remove apenas essas entradas marcadas de diário de backfill de `DREAMS.md`.
- **Clear Grounded** remove apenas entradas encenadas de curto prazo, somente ancoradas, que vieram de replay histórico e ainda não acumularam recordação ao vivo ou suporte diário.

O que elas **não** fazem por si só:

- elas não editam `MEMORY.md`
- elas não executam migrações completas do doctor
- elas não encenam automaticamente candidatos ancorados no armazenamento de promoção de curto prazo ao vivo, a menos que você execute explicitamente o caminho encenado da CLI primeiro

Se quiser que o replay histórico ancorado influencie a faixa normal de promoção profunda, use o fluxo da CLI em vez disso:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Isso encena candidatos duráveis ancorados no armazenamento de dreaming de curto prazo, mantendo `DREAMS.md` como a superfície de revisão.

## Comportamento detalhado e justificativa

<AccordionGroup>
  <Accordion title="0. Atualização opcional (instalações via git)">
    Se este for um checkout git e o doctor estiver sendo executado de forma interativa, ele oferece atualizar (fetch/rebase/build) antes de executar o doctor.
  </Accordion>
  <Accordion title="1. Normalização de configuração">
    Se a configuração contiver formatos de valores legados (por exemplo, `messages.ackReaction` sem uma substituição específica de canal), o doctor os normaliza para o schema atual.

    Isso inclui campos planos legados do Talk. A configuração pública atual do Talk é `talk.provider` + `talk.providers.<provider>`. O doctor reescreve formatos antigos `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` para o mapa de provedores.

    O doctor também avisa quando `plugins.allow` não está vazio e a política de ferramentas usa
    curingas ou entradas de ferramentas pertencentes a plugins. `tools.allow: ["*"]` corresponde apenas a ferramentas
    de plugins que realmente carregam; ele não ignora a lista de permissões exclusiva de plugins.

  </Accordion>
  <Accordion title="2. Migrações de chaves de configuração legadas">
    Quando a configuração contém chaves obsoletas, outros comandos se recusam a executar e pedem que você execute `openclaw doctor`.

    O doctor irá:

    - Explicar quais chaves legadas foram encontradas.
    - Mostrar a migração que ele aplicou.
    - Reescrever `~/.openclaw/openclaw.json` com o schema atualizado.

    O Gateway também executa automaticamente migrações do doctor na inicialização quando detecta um formato de configuração legado, então configurações obsoletas são reparadas sem intervenção manual. Migrações de armazenamento de tarefas Cron são tratadas por `openclaw doctor --fix`.

    Migrações atuais:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - configurações de canais configurados sem política de resposta visível → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` de nível superior
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` legados → `talk.provider` + `talk.providers.<provider>`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` e `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` e `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` e `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` e `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - Para canais com `accounts` nomeadas, mas valores de canal de nível superior de conta única remanescentes, mova esses valores com escopo de conta para a conta promovida escolhida para esse canal (`accounts.default` para a maioria dos canais; Matrix pode preservar um destino nomeado/padrão correspondente existente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - remova `agents.defaults.llm`; use `models.providers.<id>.timeoutSeconds` para tempos limite de provedores/modelos lentos
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - remova `browser.relayBindHost` (configuração legada de retransmissão da extensão)
    - `models.providers.*.api: "openai"` legado → `"openai-completions"` (a inicialização do gateway também ignora provedores cujo `api` está definido como um valor enum futuro ou desconhecido, em vez de falhar fechado)

    Os avisos do doctor também incluem orientação de conta padrão para canais com várias contas:

    - Se duas ou mais entradas `channels.<channel>.accounts` estiverem configuradas sem `channels.<channel>.defaultAccount` ou `accounts.default`, o doctor avisa que o roteamento de fallback pode escolher uma conta inesperada.
    - Se `channels.<channel>.defaultAccount` estiver definido como um ID de conta desconhecido, o doctor avisa e lista os IDs de conta configurados.

  </Accordion>
  <Accordion title="2b. Substituições do provedor OpenCode">
    Se você adicionou `models.providers.opencode`, `opencode-zen` ou `opencode-go` manualmente, isso substitui o catálogo OpenCode integrado de `@mariozechner/pi-ai`. Isso pode forçar modelos para a API errada ou zerar custos. O doctor avisa para que você possa remover a substituição e restaurar o roteamento de API + custos por modelo.
  </Accordion>
  <Accordion title="2c. Migração de navegador e prontidão do Chrome MCP">
    Se a configuração do seu navegador ainda aponta para o caminho removido da extensão do Chrome, o doctor a normaliza para o modelo atual de anexação do Chrome MCP local ao host:

    - `browser.profiles.*.driver: "extension"` se torna `"existing-session"`
    - `browser.relayBindHost` é removido

    O doctor também audita o caminho do Chrome MCP local ao host quando você usa `defaultProfile: "user"` ou um perfil `existing-session` configurado:

    - verifica se o Google Chrome está instalado no mesmo host para perfis padrão de conexão automática
    - verifica a versão detectada do Chrome e avisa quando ela está abaixo do Chrome 144
    - lembra você de habilitar a depuração remota na página de inspeção do navegador (por exemplo, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    O doctor não pode habilitar a configuração do lado do Chrome para você. O Chrome MCP local ao host ainda exige:

    - um navegador baseado em Chromium 144+ no host do gateway/node
    - o navegador em execução localmente
    - depuração remota habilitada nesse navegador
    - aprovação do primeiro prompt de consentimento de anexação no navegador

    A prontidão aqui diz respeito apenas aos pré-requisitos de anexação local. `Existing-session` mantém os limites atuais de rota do Chrome MCP; rotas avançadas como `responsebody`, exportação de PDF, interceptação de download e ações em lote ainda exigem um navegador gerenciado ou perfil CDP bruto.

    Esta verificação **não** se aplica a Docker, sandbox, navegador remoto ou outros fluxos headless. Eles continuam usando CDP bruto.

  </Accordion>
  <Accordion title="2d. Pré-requisitos de TLS do OAuth">
    Quando um perfil OAuth do OpenAI Codex está configurado, o doctor consulta o endpoint de autorização da OpenAI para verificar se a pilha TLS local de Node/OpenSSL consegue validar a cadeia de certificados. Se a consulta falhar com um erro de certificado (por exemplo, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado expirado ou certificado autoassinado), o doctor imprime orientação de correção específica para a plataforma. No macOS com um Node do Homebrew, a correção geralmente é `brew postinstall ca-certificates`. Com `--deep`, a consulta é executada mesmo se o gateway estiver saudável.
  </Accordion>
  <Accordion title="2e. Substituições do provedor OAuth do Codex">
    Se você adicionou anteriormente configurações legadas de transporte da OpenAI em `models.providers.openai-codex`, elas podem sombrear o caminho integrado do provedor OAuth do Codex que versões mais novas usam automaticamente. O doctor avisa quando vê essas configurações antigas de transporte junto com o OAuth do Codex para que você possa remover ou reescrever a substituição de transporte obsoleta e recuperar o comportamento integrado de roteamento/fallback. Proxies personalizados e substituições apenas de cabeçalho ainda são compatíveis e não acionam este aviso.
  </Accordion>
  <Accordion title="2f. Avisos de rota do Plugin Codex">
    Quando o Plugin Codex incluído está habilitado, o doctor também verifica se referências de modelo primário `openai-codex/*` ainda são resolvidas pelo executor padrão do PI. Essa combinação é válida quando você quer autenticação OAuth/assinatura do Codex pelo PI, mas é fácil confundi-la com o harness nativo do app-server do Codex. O doctor avisa e aponta para o formato explícito do app-server: `openai/*` mais `agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex`.

    O doctor não repara isso automaticamente porque ambas as rotas são válidas:

    - `openai-codex/*` + PI significa "usar autenticação OAuth/assinatura do Codex pelo executor normal do OpenClaw."
    - `openai/*` + `agentRuntime.id: "codex"` significa "executar o turno incorporado pelo app-server nativo do Codex."
    - `/codex ...` significa "controlar ou vincular uma conversa nativa do Codex pelo chat."
    - `/acp ...` ou `runtime: "acp"` significa "usar o adaptador externo ACP/acpx."

    Se o aviso aparecer, escolha a rota pretendida e edite a configuração manualmente. Mantenha o aviso como está quando o OAuth do Codex via PI for intencional.

  </Accordion>
  <Accordion title="3. Migrações de estado legado (layout em disco)">
    O doctor pode migrar layouts mais antigos em disco para a estrutura atual:

    - Armazenamento de sessões + transcrições:
      - de `~/.openclaw/sessions/` para `~/.openclaw/agents/<agentId>/sessions/`
    - Diretório do agente:
      - de `~/.openclaw/agent/` para `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticação do WhatsApp (Baileys):
      - de `~/.openclaw/credentials/*.json` legado (exceto `oauth.json`)
      - para `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID da conta padrão: `default`)

    Essas migrações são por melhor esforço e idempotentes; o doctor emitirá avisos quando deixar quaisquer pastas legadas para trás como backups. O Gateway/CLI também migra automaticamente o armazenamento legado de sessões + diretório do agente na inicialização para que histórico/autenticação/modelos cheguem ao caminho por agente sem uma execução manual do doctor. A autenticação do WhatsApp é intencionalmente migrada apenas via `openclaw doctor`. A normalização de provedor/mapa de provedores de conversa agora compara por igualdade estrutural, então diferenças apenas na ordem das chaves não acionam mais alterações repetidas sem efeito de `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migrações de manifestos de Plugin legados">
    O doctor verifica todos os manifestos de Plugin instalados em busca de chaves de capacidade de nível superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando encontradas, ele oferece movê-las para o objeto `contracts` e reescrever o arquivo de manifesto no local. Esta migração é idempotente; se a chave `contracts` já tiver os mesmos valores, a chave legada é removida sem duplicar os dados.
  </Accordion>
  <Accordion title="3b. Migrações de armazenamento Cron legado">
    O doctor também verifica o armazenamento de trabalhos cron (`~/.openclaw/cron/jobs.json` por padrão, ou `cron.store` quando substituído) em busca de formatos antigos de trabalhos que o agendador ainda aceita por compatibilidade.

    As limpezas atuais de cron incluem:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de payload de nível superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nível superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliases de entrega `provider` do payload → `delivery.channel` explícito
    - trabalhos simples legados de fallback de webhook `notify: true` → `delivery.mode="webhook"` explícito com `delivery.to=cron.webhook`

    O doctor só migra automaticamente trabalhos `notify: true` quando consegue fazer isso sem alterar o comportamento. Se um trabalho combina fallback legado de notificação com um modo de entrega não webhook existente, o doctor avisa e deixa esse trabalho para revisão manual.

    No Linux, o doctor também avisa quando o crontab do usuário ainda invoca o `~/.openclaw/bin/ensure-whatsapp.sh` legado. Esse script local ao host não é mantido pelo OpenClaw atual e pode gravar mensagens falsas de `Gateway inactive` em `~/.openclaw/logs/whatsapp-health.log` quando o cron não consegue alcançar o barramento de usuário do systemd. Remova a entrada obsoleta do crontab com `crontab -e`; use `openclaw channels status --probe`, `openclaw doctor` e `openclaw gateway status` para verificações de integridade atuais.

  </Accordion>
  <Accordion title="3c. Limpeza de bloqueios de sessão">
    O doctor verifica cada diretório de sessão de agente em busca de arquivos de bloqueio de escrita obsoletos — arquivos deixados para trás quando uma sessão foi encerrada de forma anormal. Para cada arquivo de bloqueio encontrado, ele relata: o caminho, PID, se o PID ainda está ativo, a idade do bloqueio e se ele é considerado obsoleto (PID inativo ou mais antigo que 30 minutos). No modo `--fix` / `--repair`, ele remove arquivos de bloqueio obsoletos automaticamente; caso contrário, imprime uma observação e instrui você a executar novamente com `--fix`.
  </Accordion>
  <Accordion title="3d. Reparo de ramificação de transcrição de sessão">
    O doctor verifica arquivos JSONL de sessão de agente em busca do formato de ramificação duplicada criado pelo bug de reescrita de transcrição de prompt de 2026.4.24: uma interação de usuário abandonada com contexto de runtime interno do OpenClaw mais uma ramificação irmã ativa contendo o mesmo prompt de usuário visível. No modo `--fix` / `--repair`, o doctor faz backup de cada arquivo afetado ao lado do original e reescreve a transcrição para a ramificação ativa, para que o histórico do Gateway e os leitores de memória não vejam mais interações duplicadas.
  </Accordion>
  <Accordion title="4. Verificações de integridade de estado (persistência de sessão, roteamento e segurança)">
    O diretório de estado é o tronco encefálico operacional. Se ele desaparecer, você perde sessões, credenciais, logs e configuração (a menos que tenha backups em outro lugar).

    O doctor verifica:

    - **Diretório de estado ausente**: alerta sobre perda catastrófica de estado, solicita recriar o diretório e lembra que não consegue recuperar dados ausentes.
    - **Permissões do diretório de estado**: verifica a permissão de escrita; oferece reparar permissões (e emite uma dica de `chown` quando uma incompatibilidade de proprietário/grupo é detectada).
    - **Diretório de estado sincronizado com nuvem no macOS**: alerta quando o estado é resolvido sob iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...`, porque caminhos com sincronização podem causar E/S mais lenta e corridas de bloqueio/sincronização.
    - **Diretório de estado em SD ou eMMC no Linux**: alerta quando o estado é resolvido para uma origem de montagem `mmcblk*`, porque E/S aleatória baseada em SD ou eMMC pode ser mais lenta e desgastar mais rapidamente com escritas de sessão e credenciais.
    - **Diretórios de sessão ausentes**: `sessions/` e o diretório de armazenamento de sessões são necessários para persistir histórico e evitar falhas `ENOENT`.
    - **Incompatibilidade de transcrição**: alerta quando entradas recentes de sessão têm arquivos de transcrição ausentes.
    - **Sessão principal "JSONL de 1 linha"**: sinaliza quando a transcrição principal tem apenas uma linha (o histórico não está acumulando).
    - **Múltiplos diretórios de estado**: alerta quando existem várias pastas `~/.openclaw` entre diretórios home ou quando `OPENCLAW_STATE_DIR` aponta para outro lugar (o histórico pode se dividir entre instalações).
    - **Lembrete de modo remoto**: se `gateway.mode=remote`, o doctor lembra você de executá-lo no host remoto (o estado fica lá).
    - **Permissões do arquivo de configuração**: alerta se `~/.openclaw/openclaw.json` pode ser lido por grupo/todos e oferece restringir para `600`.

  </Accordion>
  <Accordion title="5. Saúde da autenticação de modelo (expiração de OAuth)">
    O doctor inspeciona perfis OAuth no armazenamento de autenticação, alerta quando tokens estão expirando/expirados e pode renová-los quando for seguro. Se o perfil OAuth/token da Anthropic estiver obsoleto, ele sugere uma chave de API da Anthropic ou o caminho de token de configuração da Anthropic. Solicitações de renovação só aparecem ao executar interativamente (TTY); `--non-interactive` ignora tentativas de renovação.

    Quando uma renovação OAuth falha permanentemente (por exemplo, `refresh_token_reused`, `invalid_grant` ou um provedor dizendo para você entrar novamente), o doctor informa que uma nova autenticação é necessária e imprime o comando exato `openclaw models auth login --provider ...` a ser executado.

    O doctor também relata perfis de autenticação temporariamente inutilizáveis devido a:

    - períodos curtos de espera (limites de taxa/timeouts/falhas de autenticação)
    - desativações mais longas (falhas de cobrança/crédito)

  </Accordion>
  <Accordion title="6. Validação de modelo de hooks">
    Se `hooks.gmail.model` estiver definido, o doctor valida a referência do modelo contra o catálogo e a allowlist e alerta quando ela não puder ser resolvida ou não for permitida.
  </Accordion>
  <Accordion title="7. Reparo de imagem de sandbox">
    Quando o sandboxing está ativado, o doctor verifica imagens Docker e oferece criar ou trocar para nomes legados se a imagem atual estiver ausente.
  </Accordion>
  <Accordion title="7b. Limpeza de instalação de Plugin">
    O doctor remove estado legado de preparação de dependências de Plugin gerado pelo OpenClaw no modo `openclaw doctor --fix` / `openclaw doctor --repair`. Isso cobre raízes obsoletas de dependências geradas, diretórios antigos de etapa de instalação, resíduos locais de pacote de código anterior de reparo de dependências de Plugin empacotado e cópias npm gerenciadas órfãs ou recuperadas de Plugins `@openclaw/*` empacotados que podem sombrear o manifesto empacotado atual.

    O doctor também pode reinstalar Plugins baixáveis configurados quando a configuração os referencia, mas o registro local de Plugins não consegue encontrá-los. Para a externalização de Plugins empacotados de 2026.5.2, o doctor instala automaticamente Plugins baixáveis que a configuração existente já usa e então depende de `meta.lastTouchedVersion` para executar essa passagem de versão apenas uma vez. A inicialização do Gateway e o recarregamento de configuração não executam gerenciadores de pacotes; instalações de Plugin continuam sendo trabalho explícito de doctor/instalação/atualização.

  </Accordion>
  <Accordion title="8. Migrações de serviço do Gateway e dicas de limpeza">
    O doctor detecta serviços legados do Gateway (launchd/systemd/schtasks) e oferece removê-los e instalar o serviço OpenClaw usando a porta atual do Gateway. Ele também pode procurar serviços extras semelhantes ao Gateway e imprimir dicas de limpeza. Serviços do Gateway do OpenClaw nomeados por perfil são considerados de primeira classe e não são sinalizados como "extras".

    No Linux, se o serviço de Gateway em nível de usuário estiver ausente, mas existir um serviço de Gateway do OpenClaw em nível de sistema, o doctor não instala automaticamente um segundo serviço em nível de usuário. Inspecione com `openclaw gateway status --deep` ou `openclaw doctor --deep` e, em seguida, remova a duplicata ou defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando um supervisor de sistema for responsável pelo ciclo de vida do Gateway.

  </Accordion>
  <Accordion title="8b. Migração de inicialização do Matrix">
    Quando uma conta de canal Matrix tem uma migração de estado legado pendente ou acionável, o doctor (no modo `--fix` / `--repair`) cria um snapshot pré-migração e então executa as etapas de migração de melhor esforço: migração de estado legado do Matrix e preparação de estado criptografado legado. Ambas as etapas não são fatais; erros são registrados e a inicialização continua. No modo somente leitura (`openclaw doctor` sem `--fix`), essa verificação é totalmente ignorada.
  </Accordion>
  <Accordion title="8c. Pareamento de dispositivo e desvio de autenticação">
    O doctor agora inspeciona o estado de pareamento de dispositivos como parte da passagem normal de saúde.

    O que ele relata:

    - solicitações de pareamento inicial pendentes
    - upgrades de função pendentes para dispositivos já pareados
    - upgrades de escopo pendentes para dispositivos já pareados
    - reparos de incompatibilidade de chave pública em que o ID do dispositivo ainda corresponde, mas a identidade do dispositivo não corresponde mais ao registro aprovado
    - registros pareados sem um token ativo para uma função aprovada
    - tokens pareados cujos escopos se desviaram da linha de base de pareamento aprovada
    - entradas locais em cache de token de dispositivo para a máquina atual que são anteriores a uma rotação de token no lado do Gateway ou carregam metadados de escopo obsoletos

    O doctor não aprova automaticamente solicitações de pareamento nem rotaciona automaticamente tokens de dispositivo. Em vez disso, ele imprime as próximas etapas exatas:

    - inspecione solicitações pendentes com `openclaw devices list`
    - aprove a solicitação exata com `openclaw devices approve <requestId>`
    - rotacione um token novo com `openclaw devices rotate --device <deviceId> --role <role>`
    - remova e reaprove um registro obsoleto com `openclaw devices remove <deviceId>`

    Isso fecha a lacuna comum de "já pareado, mas ainda recebendo pareamento necessário": agora o doctor distingue pareamento inicial de upgrades pendentes de função/escopo e de desvio de token/identidade do dispositivo obsoleto.

  </Accordion>
  <Accordion title="9. Avisos de segurança">
    O doctor emite avisos quando um provedor está aberto a DMs sem uma lista de permissão, ou quando uma política está configurada de forma perigosa.
  </Accordion>
  <Accordion title="10. Linger do systemd (Linux)">
    Se estiver em execução como um serviço de usuário do systemd, o doctor garante que o linger esteja habilitado para que o Gateway permaneça ativo após o logout.
  </Accordion>
  <Accordion title="11. Status do workspace (skills, plugins e diretórios legados)">
    O doctor imprime um resumo do estado do workspace para o agente padrão:

    - **Status das Skills**: conta Skills elegíveis, com requisitos ausentes e bloqueadas pela lista de permissão.
    - **Diretórios legados do workspace**: avisa quando `~/openclaw` ou outros diretórios legados do workspace existem junto ao workspace atual.
    - **Status de Plugin**: conta plugins habilitados/desabilitados/com erro; lista IDs de plugins para quaisquer erros; relata capacidades de plugins de pacote.
    - **Avisos de compatibilidade de Plugin**: sinaliza plugins que têm problemas de compatibilidade com o runtime atual.
    - **Diagnósticos de Plugin**: expõe quaisquer avisos ou erros em tempo de carregamento emitidos pelo registro de plugins.

  </Accordion>
  <Accordion title="11b. Tamanho do arquivo de bootstrap">
    O doctor verifica se os arquivos de bootstrap do workspace (por exemplo, `AGENTS.md`, `CLAUDE.md` ou outros arquivos de contexto injetados) estão próximos ou acima do orçamento de caracteres configurado. Ele relata, por arquivo, contagens de caracteres brutos vs. injetados, percentual de truncamento, causa do truncamento (`max/file` ou `max/total`) e o total de caracteres injetados como uma fração do orçamento total. Quando os arquivos são truncados ou estão próximos do limite, o doctor imprime dicas para ajustar `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Limpeza de Plugin de canal obsoleto">
    Quando `openclaw doctor --fix` remove um Plugin de canal ausente, ele também remove a configuração pendente com escopo de canal que referenciava esse Plugin: entradas `channels.<id>`, destinos de Heartbeat que nomeavam o canal e substituições de `agents.*.models["<channel>/*"]`. Isso evita loops de inicialização do Gateway em que o runtime do canal desapareceu, mas a configuração ainda solicita que o Gateway se vincule a ele.
  </Accordion>
  <Accordion title="11c. Completação do shell">
    O doctor verifica se a completação por tab está instalada para o shell atual (zsh, bash, fish ou PowerShell):

    - Se o perfil do shell usa um padrão lento de completação dinâmica (`source <(openclaw completion ...)`), o doctor o atualiza para a variante mais rápida de arquivo em cache.
    - Se a completação está configurada no perfil, mas o arquivo de cache está ausente, o doctor regenera o cache automaticamente.
    - Se nenhuma completação está configurada, o doctor solicita a instalação (somente modo interativo; ignorado com `--non-interactive`).

    Execute `openclaw completion --write-state` para regenerar o cache manualmente.

  </Accordion>
  <Accordion title="12. Verificações de autenticação do Gateway (token local)">
    O doctor verifica a prontidão da autenticação por token do gateway local.

    - Se o modo de token precisa de um token e nenhuma fonte de token existe, o doctor oferece gerar um.
    - Se `gateway.auth.token` é gerenciado por SecretRef, mas está indisponível, o doctor avisa e não o substitui por texto simples.
    - `openclaw doctor --generate-gateway-token` força a geração somente quando nenhum SecretRef de token está configurado.

  </Accordion>
  <Accordion title="12b. Reparos somente leitura cientes de SecretRef">
    Alguns fluxos de reparo precisam inspecionar credenciais configuradas sem enfraquecer o comportamento fail-fast do runtime.

    - `openclaw doctor --fix` agora usa o mesmo modelo de resumo SecretRef somente leitura dos comandos da família de status para reparos de configuração direcionados.
    - Exemplo: o reparo de `allowFrom` / `groupAllowFrom` `@username` do Telegram tenta usar credenciais de bot configuradas quando disponíveis.
    - Se o token do bot do Telegram estiver configurado via SecretRef, mas indisponível no caminho de comando atual, o doctor relata que a credencial está configurada, mas indisponível, e ignora a resolução automática em vez de travar ou relatar incorretamente o token como ausente.

  </Accordion>
  <Accordion title="13. Verificação de integridade do Gateway + reinicialização">
    O Doctor executa uma verificação de integridade e oferece reiniciar o Gateway quando ele parece não estar saudável.
  </Accordion>
  <Accordion title="13b. Prontidão da busca de memória">
    O Doctor verifica se o provedor de embeddings de busca de memória configurado está pronto para o agente padrão. O comportamento depende do backend e do provedor configurados:

    - **Backend QMD**: verifica se o binário `qmd` está disponível e pode ser iniciado. Caso contrário, imprime orientações de correção incluindo o pacote npm e uma opção de caminho manual para o binário.
    - **Provedor local explícito**: verifica se há um arquivo de modelo local ou uma URL de modelo remoto/baixável reconhecida. Se estiver ausente, sugere mudar para um provedor remoto.
    - **Provedor remoto explícito** (`openai`, `voyage` etc.): verifica se uma chave de API está presente no ambiente ou no armazenamento de autenticação. Imprime dicas de correção acionáveis se estiver ausente.
    - **Provedor automático**: verifica primeiro a disponibilidade do modelo local e depois tenta cada provedor remoto na ordem de seleção automática.

    Quando há um resultado de sondagem do Gateway em cache disponível (o Gateway estava íntegro no momento da verificação), o Doctor cruza seu resultado com a configuração visível pela CLI e observa qualquer discrepância. O Doctor não inicia um novo ping de embedding no caminho padrão; use o comando de status profundo da memória quando quiser uma verificação ao vivo do provedor.

    Use `openclaw memory status --deep` para verificar a prontidão de embeddings em tempo de execução.

  </Accordion>
  <Accordion title="14. Avisos de status de canal">
    Se o Gateway estiver íntegro, o Doctor executa uma sondagem de status de canal e relata avisos com correções sugeridas.
  </Accordion>
  <Accordion title="15. Auditoria + reparo da configuração do supervisor">
    O Doctor verifica a configuração do supervisor instalada (launchd/systemd/schtasks) em busca de padrões ausentes ou desatualizados (por exemplo, dependências `network-online` do systemd e atraso de reinicialização). Quando encontra uma incompatibilidade, ele recomenda uma atualização e pode reescrever o arquivo de serviço/tarefa para os padrões atuais.

    Observações:

    - `openclaw doctor` solicita confirmação antes de reescrever a configuração do supervisor.
    - `openclaw doctor --yes` aceita as solicitações de reparo padrão.
    - `openclaw doctor --repair` aplica as correções recomendadas sem solicitações.
    - `openclaw doctor --repair --force` sobrescreve configurações personalizadas do supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantém o Doctor somente leitura para o ciclo de vida do serviço do Gateway. Ele ainda relata a integridade do serviço e executa reparos que não são de serviço, mas ignora instalação/início/reinício/bootstrap do serviço, reescritas da configuração do supervisor e limpeza de serviço legado porque um supervisor externo é dono desse ciclo de vida.
    - No Linux, o Doctor não reescreve metadados de comando/entrypoint enquanto a unidade systemd correspondente do Gateway estiver ativa. Ele também ignora unidades extras inativas semelhantes ao Gateway que não sejam legadas durante a varredura de serviços duplicados, para que arquivos de serviço auxiliares não gerem ruído de limpeza.
    - Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação/reparo do serviço pelo Doctor valida o SecretRef, mas não persiste valores de token em texto simples resolvidos nos metadados de ambiente do serviço do supervisor.
    - O Doctor detecta valores de ambiente de serviço gerenciados com suporte em `.env`/SecretRef que instalações antigas de LaunchAgent, systemd ou Tarefa Agendada do Windows incorporaram inline e reescreve os metadados do serviço para que esses valores sejam carregados da origem de tempo de execução em vez da definição do supervisor.
    - O Doctor detecta quando o comando de serviço ainda fixa uma `--port` antiga após alterações em `gateway.port` e reescreve os metadados do serviço para a porta atual.
    - Se a autenticação por token exigir um token e o SecretRef de token configurado não puder ser resolvido, o Doctor bloqueia o caminho de instalação/reparo com orientação acionável.
    - Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, o Doctor bloqueia instalação/reparo até que o modo seja definido explicitamente.
    - Para unidades user-systemd no Linux, as verificações de divergência de token do Doctor agora incluem fontes `Environment=` e `EnvironmentFile=` ao comparar metadados de autenticação do serviço.
    - Reparos de serviço pelo Doctor se recusam a reescrever, interromper ou reiniciar um serviço de Gateway de um binário OpenClaw mais antigo quando a configuração foi gravada pela última vez por uma versão mais nova. Consulte [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Você sempre pode forçar uma reescrita completa via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnósticos de tempo de execução + porta do Gateway">
    O Doctor inspeciona o tempo de execução do serviço (PID, último status de saída) e avisa quando o serviço está instalado, mas não está realmente em execução. Ele também verifica colisões de porta na porta do Gateway (padrão `18789`) e relata causas prováveis (Gateway já em execução, túnel SSH).
  </Accordion>
  <Accordion title="17. Boas práticas de tempo de execução do Gateway">
    O Doctor avisa quando o serviço do Gateway é executado no Bun ou em um caminho do Node gerenciado por versão (`nvm`, `fnm`, `volta`, `asdf` etc.). Os canais WhatsApp + Telegram exigem Node, e caminhos de gerenciadores de versão podem quebrar após upgrades porque o serviço não carrega a inicialização do seu shell. O Doctor oferece migrar para uma instalação do Node do sistema quando disponível (Homebrew/apt/choco).

    LaunchAgents do macOS recém-instalados ou reparados usam um PATH canônico do sistema (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) em vez de copiar o PATH do shell interativo, de modo que Volta, asdf, fnm, pnpm e outros diretórios de gerenciadores de versão não alterem qual Node os processos filhos resolvem. Serviços Linux ainda mantêm raízes de ambiente explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e diretórios user-bin estáveis, mas diretórios fallback presumidos de gerenciadores de versão só são gravados no PATH do serviço quando esses diretórios existem no disco.

  </Accordion>
  <Accordion title="18. Gravação de configuração + metadados do assistente">
    O Doctor persiste quaisquer alterações de configuração e carimba metadados do assistente para registrar a execução do Doctor.
  </Accordion>
  <Accordion title="19. Dicas de workspace (backup + sistema de memória)">
    O Doctor sugere um sistema de memória do workspace quando ausente e imprime uma dica de backup se o workspace ainda não estiver sob git.

    Consulte [/concepts/agent-workspace](/pt-BR/concepts/agent-workspace) para um guia completo sobre a estrutura do workspace e backup com git (GitHub ou GitLab privado recomendado).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Runbook do Gateway](/pt-BR/gateway)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
