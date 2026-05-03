---
read_when:
    - Adicionar ou modificar migrações do doctor
    - Introduzindo alterações incompatíveis na configuração
sidebarTitle: Doctor
summary: 'Comando doctor: verificações de integridade, migrações de configuração e etapas de reparo'
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-03T21:32:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20b2cb3c3cd88e01050cb285a08a020603642439bd35668b7414360801fc03ff
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` é a ferramenta de reparo + migração do OpenClaw. Ela corrige configurações/estados obsoletos, verifica a integridade e fornece etapas de reparo acionáveis.

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

    Aceita os padrões sem solicitar confirmação (incluindo etapas de reparo de reinício/serviço/sandbox quando aplicável).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Aplica os reparos recomendados sem solicitar confirmação (reparos + reinícios quando seguro).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Também aplica reparos agressivos (sobrescreve configurações personalizadas do supervisor).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Executa sem prompts e aplica apenas migrações seguras (normalização de configuração + movimentações de estado em disco). Ignora ações de reinício/serviço/sandbox que exigem confirmação humana. Migrações de estado legado são executadas automaticamente quando detectadas.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Examina serviços do sistema em busca de instalações extras do gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se quiser revisar as alterações antes de gravar, abra o arquivo de configuração primeiro:

```bash
cat ~/.openclaw/openclaw.json
```

## O que ele faz (resumo)

<AccordionGroup>
  <Accordion title="Integridade, UI e atualizações">
    - Atualização prévia opcional para instalações via git (somente interativo).
    - Verificação de atualização do protocolo da UI (reconstrói a Control UI quando o esquema do protocolo é mais novo).
    - Verificação de integridade + prompt de reinício.
    - Resumo de status de Skills (elegíveis/ausentes/bloqueadas) e status de plugins.

  </Accordion>
  <Accordion title="Configuração e migrações">
    - Normalização de configuração para valores legados.
    - Migração da configuração de Talk de campos planos legados `talk.*` para `talk.provider` + `talk.providers.<provider>`.
    - Verificações de migração de navegador para configurações legadas de extensão do Chrome e prontidão do MCP do Chrome.
    - Avisos de substituição do provedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avisos de sombreamento do OAuth do Codex (`models.providers.openai-codex`).
    - Verificação de pré-requisitos de TLS do OAuth para perfis OAuth do OpenAI Codex.
    - Avisos de allowlist de plugins/ferramentas quando `plugins.allow` é restritivo, mas a política de ferramentas ainda solicita curingas ou ferramentas pertencentes a plugins.
    - Migração de estado legado em disco (sessions/agent dir/WhatsApp auth).
    - Migração de chaves legadas do contrato de manifesto de plugins (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migração do armazenamento legado de cron (`jobId`, `schedule.cron`, campos de entrega/payload de nível superior, `provider` do payload, tarefas webhook fallback simples `notify: true`).
    - Migração da política de runtime de agentes legada para `agents.defaults.agentRuntime` e `agents.list[].agentRuntime`.
    - Limpeza de configuração obsoleta de plugins quando plugins estão habilitados; quando `plugins.enabled=false`, referências obsoletas a plugins são tratadas como configuração de contenção inerte e preservadas.

  </Accordion>
  <Accordion title="Estado e integridade">
    - Inspeção de arquivos de bloqueio de sessão e limpeza de bloqueios obsoletos.
    - Reparo de transcritos de sessão para ramificações duplicadas de reescrita de prompt criadas por builds 2026.4.24 afetados.
    - Detecção de tombstone de recuperação por reinício de subagente travado, com suporte a `--fix` para limpar flags obsoletas de recuperação abortada, para que a inicialização não continue tratando o filho como abortado por reinício.
    - Verificações de integridade de estado e permissões (sessions, transcripts, state dir).
    - Verificações de permissão do arquivo de configuração (chmod 600) ao executar localmente.
    - Integridade de autenticação de modelos: verifica expiração de OAuth, pode atualizar tokens prestes a expirar e relata estados de cooldown/desabilitado de perfis de autenticação.
    - Detecção de diretório de workspace extra (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, serviços e supervisores">
    - Reparo de imagem de sandbox quando sandboxing está habilitado.
    - Migração de serviço legado e detecção de gateway extra.
    - Migração de estado legado do canal Matrix (em modo `--fix` / `--repair`).
    - Verificações de runtime do gateway (serviço instalado, mas não em execução; rótulo launchd em cache).
    - Avisos de status de canais (sondados a partir do gateway em execução).
    - Auditoria de configuração do supervisor (launchd/systemd/schtasks) com reparo opcional.
    - Limpeza do ambiente de proxy embutido para serviços de gateway que capturaram valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante a instalação ou atualização.
    - Verificações de boas práticas de runtime do gateway (Node vs Bun, caminhos de gerenciadores de versão).
    - Diagnósticos de colisão de porta do gateway (padrão `18789`).

  </Accordion>
  <Accordion title="Autenticação, segurança e pareamento">
    - Avisos de segurança para políticas abertas de DM.
    - Verificações de autenticação do gateway para modo de token local (oferece geração de token quando não existe fonte de token; não sobrescreve configurações SecretRef de token).
    - Detecção de problemas de pareamento de dispositivo (solicitações pendentes de primeiro pareamento, upgrades pendentes de função/escopo, desvio obsoleto do cache local de token de dispositivo e desvio de autenticação de registro pareado).

  </Accordion>
  <Accordion title="Workspace e shell">
    - Verificação de linger do systemd no Linux.
    - Verificação de tamanho do arquivo de bootstrap do workspace (avisos de truncamento/próximo do limite para arquivos de contexto).
    - Verificação de prontidão de Skills para o agente padrão; relata skills permitidas com bins, env, configuração ou requisitos de SO ausentes, e `--fix` pode desabilitar skills indisponíveis em `skills.entries`.
    - Verificação de status de complementação de shell e instalação/atualização automática.
    - Verificação de prontidão do provedor de embeddings de busca de memória (modelo local, chave de API remota ou binário QMD).
    - Verificações de instalação a partir do código-fonte (incompatibilidade de workspace pnpm, assets de UI ausentes, binário tsx ausente).
    - Grava configuração atualizada + metadados do assistente.

  </Accordion>
</AccordionGroup>

## Preenchimento retroativo e redefinição da UI Dreams

A cena Dreams da Control UI inclui ações **Preenchimento retroativo**, **Redefinir** e **Limpar fundamentadas** para o fluxo de trabalho de grounded dreaming. Essas ações usam métodos RPC no estilo do doctor do gateway, mas **não** fazem parte do reparo/migração da CLI `openclaw doctor`.

O que elas fazem:

- **Preenchimento retroativo** examina arquivos históricos `memory/YYYY-MM-DD.md` no workspace ativo, executa a passagem de diário REM fundamentada e grava entradas reversíveis de preenchimento retroativo em `DREAMS.md`.
- **Redefinir** remove apenas essas entradas de diário de preenchimento retroativo marcadas de `DREAMS.md`.
- **Limpar fundamentadas** remove apenas entradas de curto prazo staged apenas fundamentadas que vieram de replay histórico e ainda não acumularam recall ao vivo ou suporte diário.

O que elas **não** fazem por si só:

- elas não editam `MEMORY.md`
- elas não executam migrações completas do doctor
- elas não staged automaticamente candidatas fundamentadas no armazenamento de promoção de curto prazo ao vivo, a menos que você execute explicitamente o caminho staged da CLI primeiro

Se quiser que o replay histórico fundamentado influencie a trilha normal de promoção profunda, use o fluxo da CLI em vez disso:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Isso coloca candidatas duráveis fundamentadas no armazenamento de dreaming de curto prazo, mantendo `DREAMS.md` como a superfície de revisão.

## Comportamento detalhado e justificativa

<AccordionGroup>
  <Accordion title="0. Atualização opcional (instalações via git)">
    Se esta for uma checkout git e o doctor estiver sendo executado interativamente, ele oferece atualizar (fetch/rebase/build) antes de executar o doctor.
  </Accordion>
  <Accordion title="1. Normalização de configuração">
    Se a configuração contiver formatos de valores legados (por exemplo, `messages.ackReaction` sem uma substituição específica de canal), o doctor os normaliza para o esquema atual.

    Isso inclui campos planos legados do Talk. A configuração pública atual do Talk é `talk.provider` + `talk.providers.<provider>`. O doctor reescreve formatos antigos `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` para o mapa de provedores.

    O doctor também avisa quando `plugins.allow` não está vazio e a política de ferramentas usa
    entradas de ferramenta curinga ou pertencentes a plugins. `tools.allow: ["*"]` corresponde apenas a ferramentas
    de plugins que realmente carregam; ele não contorna a allowlist exclusiva de plugins.

  </Accordion>
  <Accordion title="2. Migrações de chaves de configuração legadas">
    Quando a configuração contém chaves obsoletas, outros comandos se recusam a executar e pedem que você execute `openclaw doctor`.

    O doctor irá:

    - Explicar quais chaves legadas foram encontradas.
    - Mostrar a migração aplicada.
    - Reescrever `~/.openclaw/openclaw.json` com o esquema atualizado.

    O Gateway também executa automaticamente migrações do doctor na inicialização quando detecta um formato de configuração legado, então configurações obsoletas são reparadas sem intervenção manual. Migrações do armazenamento de tarefas Cron são tratadas por `openclaw doctor --fix`.

    Migrações atuais:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - configurações de canais configurados sem política de resposta visível → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` no nível superior
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - legado `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
    - Para canais com `accounts` nomeadas, mas com valores de canal de nível superior de conta única remanescentes, mova esses valores com escopo de conta para a conta promovida escolhida para esse canal (`accounts.default` para a maioria dos canais; Matrix pode preservar um destino nomeado/padrão correspondente existente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - remova `agents.defaults.llm`; use `models.providers.<id>.timeoutSeconds` para tempos limite de provedores/modelos lentos
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - remova `browser.relayBindHost` (configuração legada de relay da extensão)
    - legado `models.providers.*.api: "openai"` → `"openai-completions"` (a inicialização do Gateway também ignora provedores cujo `api` esteja definido como um valor de enumeração futuro ou desconhecido, em vez de falhar de forma fechada)

    Os avisos do Doctor também incluem orientação de conta padrão para canais com várias contas:

    - Se duas ou mais entradas `channels.<channel>.accounts` forem configuradas sem `channels.<channel>.defaultAccount` ou `accounts.default`, o doctor avisa que o roteamento de fallback pode escolher uma conta inesperada.
    - Se `channels.<channel>.defaultAccount` estiver definido como um ID de conta desconhecido, o doctor avisa e lista os IDs de conta configurados.

  </Accordion>
  <Accordion title="2b. Substituições de provedor OpenCode">
    Se você adicionou `models.providers.opencode`, `opencode-zen` ou `opencode-go` manualmente, isso substitui o catálogo OpenCode integrado de `@mariozechner/pi-ai`. Isso pode forçar modelos para a API errada ou zerar custos. O doctor avisa para que você possa remover a substituição e restaurar o roteamento de API + custos por modelo.
  </Accordion>
  <Accordion title="2c. Migração do navegador e prontidão para Chrome MCP">
    Se a configuração do seu navegador ainda aponta para o caminho da extensão Chrome removida, o doctor a normaliza para o modelo atual de anexação Chrome MCP local ao host:

    - `browser.profiles.*.driver: "extension"` se torna `"existing-session"`
    - `browser.relayBindHost` é removido

    O doctor também audita o caminho Chrome MCP local ao host quando você usa `defaultProfile: "user"` ou um perfil `existing-session` configurado:

    - verifica se o Google Chrome está instalado no mesmo host para perfis padrão de conexão automática
    - verifica a versão detectada do Chrome e avisa quando ela está abaixo do Chrome 144
    - lembra você de habilitar a depuração remota na página de inspeção do navegador (por exemplo, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    O Doctor não pode habilitar a configuração do lado do Chrome para você. O Chrome MCP local ao host ainda exige:

    - um navegador baseado em Chromium 144+ no host do gateway/node
    - o navegador em execução localmente
    - depuração remota habilitada nesse navegador
    - aprovação do primeiro prompt de consentimento de anexação no navegador

    A prontidão aqui é apenas sobre pré-requisitos de anexação local. Existing-session mantém os limites atuais de rota do Chrome MCP; rotas avançadas como `responsebody`, exportação de PDF, interceptação de download e ações em lote ainda exigem um navegador gerenciado ou perfil CDP bruto.

    Essa verificação **não** se aplica a Docker, sandbox, remote-browser ou outros fluxos headless. Esses continuam usando CDP bruto.

  </Accordion>
  <Accordion title="2d. Pré-requisitos de TLS do OAuth">
    Quando um perfil OAuth do OpenAI Codex é configurado, o doctor consulta o endpoint de autorização da OpenAI para verificar se a pilha TLS local do Node/OpenSSL consegue validar a cadeia de certificados. Se a sondagem falhar com um erro de certificado (por exemplo, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado expirado ou certificado autoassinado), o doctor imprime orientação de correção específica da plataforma. No macOS com um Node do Homebrew, a correção geralmente é `brew postinstall ca-certificates`. Com `--deep`, a sondagem é executada mesmo que o gateway esteja íntegro.
  </Accordion>
  <Accordion title="2e. Substituições do provedor OAuth do Codex">
    Se você adicionou anteriormente configurações legadas de transporte da OpenAI em `models.providers.openai-codex`, elas podem encobrir o caminho integrado do provedor OAuth do Codex que versões mais novas usam automaticamente. O Doctor avisa quando vê essas configurações antigas de transporte junto com OAuth do Codex, para que você possa remover ou reescrever a substituição obsoleta de transporte e recuperar o comportamento integrado de roteamento/fallback. Proxies personalizados e substituições apenas de cabeçalho ainda são compatíveis e não acionam esse aviso.
  </Accordion>
  <Accordion title="2f. Avisos de rota do Plugin Codex">
    Quando o Plugin Codex integrado está habilitado, o doctor também verifica se referências de modelo primário `openai-codex/*` ainda são resolvidas pelo runner PI padrão. Essa combinação é válida quando você quer autenticação OAuth/assinatura do Codex por meio do PI, mas é fácil confundi-la com o harness nativo de servidor de app do Codex. O Doctor avisa e aponta para o formato explícito de servidor de app: `openai/*` mais `agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex`.

    O Doctor não repara isso automaticamente porque ambas as rotas são válidas:

    - `openai-codex/*` + PI significa "usar autenticação OAuth/assinatura do Codex pelo runner normal do OpenClaw."
    - `openai/*` + `agentRuntime.id: "codex"` significa "executar o turno incorporado pelo servidor de app nativo do Codex."
    - `/codex ...` significa "controlar ou vincular uma conversa nativa do Codex a partir do chat."
    - `/acp ...` ou `runtime: "acp"` significa "usar o adaptador externo ACP/acpx."

    Se o aviso aparecer, escolha a rota pretendida e edite a configuração manualmente. Mantenha o aviso como está quando PI Codex OAuth for intencional.

  </Accordion>
  <Accordion title="3. Migrações de estado legado (layout em disco)">
    O Doctor pode migrar layouts antigos em disco para a estrutura atual:

    - Armazenamento de sessões + transcrições:
      - de `~/.openclaw/sessions/` para `~/.openclaw/agents/<agentId>/sessions/`
    - Diretório do agente:
      - de `~/.openclaw/agent/` para `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticação do WhatsApp (Baileys):
      - de `~/.openclaw/credentials/*.json` legado (exceto `oauth.json`)
      - para `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID da conta padrão: `default`)

    Essas migrações são de melhor esforço e idempotentes; o doctor emitirá avisos quando deixar quaisquer pastas legadas para trás como backups. O Gateway/CLI também migra automaticamente o armazenamento legado de sessões + diretório do agente na inicialização, para que histórico/autenticação/modelos fiquem no caminho por agente sem execução manual do doctor. A autenticação do WhatsApp é intencionalmente migrada apenas por meio de `openclaw doctor`. A normalização de provedor/mapa de provedores de fala agora compara por igualdade estrutural, então diferenças apenas na ordem de chaves não acionam mais alterações repetidas sem efeito de `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migrações de manifesto de Plugin legado">
    O Doctor examina todos os manifestos de Plugin instalados em busca de chaves de capacidade de nível superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando encontradas, ele oferece movê-las para o objeto `contracts` e reescrever o arquivo de manifesto no local. Essa migração é idempotente; se a chave `contracts` já tiver os mesmos valores, a chave legada será removida sem duplicar os dados.
  </Accordion>
  <Accordion title="3b. Migrações de armazenamento Cron legado">
    O Doctor também verifica o armazenamento de jobs do cron (`~/.openclaw/cron/jobs.json` por padrão, ou `cron.store` quando substituído) em busca de formatos antigos de jobs que o agendador ainda aceita por compatibilidade.

    As limpezas atuais de cron incluem:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de payload de nível superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nível superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliases de entrega `provider` no payload → `delivery.channel` explícito
    - jobs simples legados de fallback de webhook `notify: true` → `delivery.mode="webhook"` explícito com `delivery.to=cron.webhook`

    O Doctor só migra automaticamente jobs `notify: true` quando consegue fazer isso sem alterar o comportamento. Se um job combinar fallback legado de notificação com um modo de entrega não webhook existente, o doctor avisa e deixa esse job para revisão manual.

    No Linux, o doctor também avisa quando o crontab do usuário ainda invoca o legado `~/.openclaw/bin/ensure-whatsapp.sh`. Esse script local ao host não é mantido pelo OpenClaw atual e pode escrever mensagens falsas de `Gateway inactive` em `~/.openclaw/logs/whatsapp-health.log` quando o cron não consegue alcançar o barramento de usuário do systemd. Remova a entrada obsoleta do crontab com `crontab -e`; use `openclaw channels status --probe`, `openclaw doctor` e `openclaw gateway status` para verificações de integridade atuais.

  </Accordion>
  <Accordion title="3c. Limpeza de bloqueio de sessão">
    O doctor verifica cada diretório de sessão de agente em busca de arquivos de bloqueio de escrita obsoletos — arquivos deixados para trás quando uma sessão foi encerrada de forma anormal. Para cada arquivo de bloqueio encontrado, ele informa: o caminho, o PID, se o PID ainda está ativo, a idade do bloqueio e se ele é considerado obsoleto (PID morto ou mais antigo que 30 minutos). No modo `--fix` / `--repair`, ele remove arquivos de bloqueio obsoletos automaticamente; caso contrário, imprime uma observação e instrui você a executar novamente com `--fix`.
  </Accordion>
  <Accordion title="3d. Reparo de ramificação de transcrição de sessão">
    O doctor verifica arquivos JSONL de sessão de agente em busca do formato de ramificação duplicado criado pelo bug de reescrita de transcrição de prompt da versão 2026.4.24: um turno de usuário abandonado com contexto interno de runtime do OpenClaw mais um irmão ativo contendo o mesmo prompt de usuário visível. No modo `--fix` / `--repair`, o doctor faz backup de cada arquivo afetado ao lado do original e reescreve a transcrição para a ramificação ativa, para que o histórico do Gateway e os leitores de memória não vejam mais turnos duplicados.
  </Accordion>
  <Accordion title="4. Verificações de integridade de estado (persistência de sessão, roteamento e segurança)">
    O diretório de estado é o tronco cerebral operacional. Se ele desaparecer, você perde sessões, credenciais, logs e configuração (a menos que tenha backups em outro lugar).

    O doctor verifica:

    - **Diretório de estado ausente**: avisa sobre perda catastrófica de estado, solicita recriar o diretório e lembra que não pode recuperar dados ausentes.
    - **Permissões do diretório de estado**: verifica a capacidade de escrita; oferece reparar permissões (e emite uma dica de `chown` quando uma incompatibilidade de proprietário/grupo é detectada).
    - **Diretório de estado sincronizado com a nuvem no macOS**: avisa quando o estado é resolvido sob iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...`, porque caminhos baseados em sincronização podem causar I/O mais lento e corridas de bloqueio/sincronização.
    - **Diretório de estado em SD ou eMMC no Linux**: avisa quando o estado é resolvido para uma origem de montagem `mmcblk*`, porque I/O aleatório baseado em SD ou eMMC pode ser mais lento e se desgastar mais rapidamente sob escritas de sessão e credenciais.
    - **Diretórios de sessão ausentes**: `sessions/` e o diretório de armazenamento de sessões são necessários para persistir histórico e evitar falhas `ENOENT`.
    - **Incompatibilidade de transcrição**: avisa quando entradas de sessão recentes têm arquivos de transcrição ausentes.
    - **Sessão principal "JSONL de 1 linha"**: sinaliza quando a transcrição principal tem apenas uma linha (o histórico não está se acumulando).
    - **Múltiplos diretórios de estado**: avisa quando várias pastas `~/.openclaw` existem entre diretórios home ou quando `OPENCLAW_STATE_DIR` aponta para outro lugar (o histórico pode se dividir entre instalações).
    - **Lembrete de modo remoto**: se `gateway.mode=remote`, o doctor lembra você de executá-lo no host remoto (o estado fica lá).
    - **Permissões do arquivo de configuração**: avisa se `~/.openclaw/openclaw.json` pode ser lido por grupo/todos e oferece restringir para `600`.

  </Accordion>
  <Accordion title="5. Integridade da autenticação de modelo (expiração de OAuth)">
    O doctor inspeciona perfis OAuth no armazenamento de autenticação, avisa quando tokens estão expirando/expirados e pode atualizá-los quando for seguro. Se o perfil OAuth/token da Anthropic estiver obsoleto, ele sugere uma chave de API da Anthropic ou o caminho de token de configuração da Anthropic. Solicitações de atualização só aparecem ao executar interativamente (TTY); `--non-interactive` ignora tentativas de atualização.

    Quando uma atualização OAuth falha permanentemente (por exemplo, `refresh_token_reused`, `invalid_grant` ou um provedor dizendo para você entrar novamente), o doctor informa que uma nova autenticação é necessária e imprime o comando exato `openclaw models auth login --provider ...` a executar.

    O doctor também informa perfis de autenticação temporariamente inutilizáveis devido a:

    - cooldowns curtos (limites de taxa/timeouts/falhas de autenticação)
    - desativações mais longas (falhas de cobrança/crédito)

  </Accordion>
  <Accordion title="6. Validação de modelo de hooks">
    Se `hooks.gmail.model` estiver definido, o doctor valida a referência do modelo em relação ao catálogo e à allowlist e avisa quando ela não puder ser resolvida ou não for permitida.
  </Accordion>
  <Accordion title="7. Reparo de imagem de sandbox">
    Quando o sandboxing está ativado, o doctor verifica imagens Docker e oferece criar ou mudar para nomes legados se a imagem atual estiver ausente.
  </Accordion>
  <Accordion title="7b. Limpeza de instalação de Plugin">
    O doctor remove estado legado de preparação de dependências de plugins gerado pelo OpenClaw no modo `openclaw doctor --fix` / `openclaw doctor --repair`. Isso cobre raízes de dependência geradas obsoletas, diretórios antigos de etapa de instalação e detritos locais de pacote de código anterior de reparo de dependências de plugins incluídos.

    O doctor também pode reinstalar plugins baixáveis configurados quando a configuração os referencia, mas o registro local de plugins não consegue encontrá-los. Para a externalização de plugins incluídos da versão 2026.5.2, o doctor instala automaticamente plugins baixáveis que a configuração existente já usa e então se baseia em `meta.lastTouchedVersion` para executar essa passagem de versão apenas uma vez. A inicialização do Gateway e o recarregamento de configuração não executam gerenciadores de pacotes; instalações de plugins continuam sendo trabalho explícito de doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrações de serviço Gateway e dicas de limpeza">
    O doctor detecta serviços Gateway legados (launchd/systemd/schtasks) e oferece removê-los e instalar o serviço OpenClaw usando a porta Gateway atual. Ele também pode verificar serviços extras semelhantes ao Gateway e imprimir dicas de limpeza. Serviços Gateway do OpenClaw nomeados por perfil são considerados de primeira classe e não são sinalizados como "extras".

    No Linux, se o serviço Gateway em nível de usuário estiver ausente, mas existir um serviço Gateway do OpenClaw em nível de sistema, o doctor não instala automaticamente um segundo serviço em nível de usuário. Inspecione com `openclaw gateway status --deep` ou `openclaw doctor --deep`, depois remova a duplicata ou defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando um supervisor do sistema for dono do ciclo de vida do Gateway.

  </Accordion>
  <Accordion title="8b. Migração de inicialização do Matrix">
    Quando uma conta de canal Matrix tem uma migração de estado legado pendente ou acionável, o doctor (no modo `--fix` / `--repair`) cria um snapshot pré-migração e então executa as etapas de migração de melhor esforço: migração de estado legado do Matrix e preparação de estado criptografado legado. Ambas as etapas não são fatais; erros são registrados e a inicialização continua. No modo somente leitura (`openclaw doctor` sem `--fix`), essa verificação é totalmente ignorada.
  </Accordion>
  <Accordion title="8c. Pareamento de dispositivo e desvio de autenticação">
    O doctor agora inspeciona o estado de pareamento de dispositivos como parte da passagem normal de integridade.

    O que ele informa:

    - solicitações pendentes de primeiro pareamento
    - upgrades de função pendentes para dispositivos já pareados
    - upgrades de escopo pendentes para dispositivos já pareados
    - reparos de incompatibilidade de chave pública quando o id do dispositivo ainda corresponde, mas a identidade do dispositivo não corresponde mais ao registro aprovado
    - registros pareados sem um token ativo para uma função aprovada
    - tokens pareados cujos escopos desviam para fora da linha de base de pareamento aprovada
    - entradas locais em cache de token de dispositivo para a máquina atual anteriores a uma rotação de token no lado do Gateway ou com metadados de escopo obsoletos

    O doctor não aprova automaticamente solicitações de pareamento nem rotaciona automaticamente tokens de dispositivo. Em vez disso, ele imprime as próximas etapas exatas:

    - inspecione solicitações pendentes com `openclaw devices list`
    - aprove a solicitação exata com `openclaw devices approve <requestId>`
    - rotacione um token novo com `openclaw devices rotate --device <deviceId> --role <role>`
    - remova e aprove novamente um registro obsoleto com `openclaw devices remove <deviceId>`

    Isso fecha a lacuna comum de "já pareado, mas ainda recebendo pareamento necessário": o doctor agora distingue primeiro pareamento de upgrades pendentes de função/escopo e de desvio obsoleto de token/identidade do dispositivo.

  </Accordion>
  <Accordion title="9. Avisos de segurança">
    O doctor emite avisos quando um provedor está aberto a DMs sem uma allowlist, ou quando uma política está configurada de forma perigosa.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Se estiver em execução como um serviço de usuário systemd, o doctor garante que o lingering esteja ativado para que o Gateway permaneça ativo após o logout.
  </Accordion>
  <Accordion title="11. Status do workspace (skills, plugins e diretórios legados)">
    O doctor imprime um resumo do estado do workspace para o agente padrão:

    - **Status de Skills**: conta Skills elegíveis, com requisitos ausentes e bloqueadas por allowlist.
    - **Diretórios legados do workspace**: avisa quando `~/openclaw` ou outros diretórios legados de workspace existem ao lado do workspace atual.
    - **Status de Plugin**: conta plugins ativados/desativados/com erro; lista IDs de plugin para quaisquer erros; informa capacidades de plugins incluídos.
    - **Avisos de compatibilidade de Plugin**: sinaliza plugins com problemas de compatibilidade com o runtime atual.
    - **Diagnósticos de Plugin**: expõe quaisquer avisos ou erros em tempo de carregamento emitidos pelo registro de plugins.

  </Accordion>
  <Accordion title="11b. Tamanho do arquivo de bootstrap">
    O doctor verifica se os arquivos de bootstrap do workspace (por exemplo, `AGENTS.md`, `CLAUDE.md` ou outros arquivos de contexto injetados) estão perto ou acima do orçamento de caracteres configurado. Ele informa contagens de caracteres brutas vs. injetadas por arquivo, porcentagem de truncamento, causa do truncamento (`max/file` ou `max/total`) e total de caracteres injetados como fração do orçamento total. Quando arquivos são truncados ou estão perto do limite, o doctor imprime dicas para ajustar `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Limpeza de plugin de canal obsoleto">
    Quando `openclaw doctor --fix` remove um plugin de canal ausente, ele também remove a configuração pendente no escopo do canal que referenciava esse plugin: entradas `channels.<id>`, alvos de Heartbeat que nomeavam o canal e substituições `agents.*.models["<channel>/*"]`. Isso evita loops de inicialização do Gateway em que o runtime do canal se foi, mas a configuração ainda pede que o Gateway se vincule a ele.
  </Accordion>
  <Accordion title="11c. Conclusão de shell">
    O doctor verifica se a conclusão por tab está instalada para o shell atual (zsh, bash, fish ou PowerShell):

    - Se o perfil de shell usa um padrão lento de conclusão dinâmica (`source <(openclaw completion ...)`), o doctor o atualiza para a variante mais rápida de arquivo em cache.
    - Se a conclusão está configurada no perfil, mas o arquivo de cache está ausente, o doctor regenera o cache automaticamente.
    - Se nenhuma conclusão estiver configurada, o doctor solicita instalá-la (apenas modo interativo; ignorado com `--non-interactive`).

    Execute `openclaw completion --write-state` para regenerar o cache manualmente.

  </Accordion>
  <Accordion title="12. Verificações de autenticação do Gateway (token local)">
    O doctor verifica a prontidão da autenticação por token local do Gateway.

    - Se o modo de token precisa de um token e nenhuma fonte de token existe, o doctor oferece gerar um.
    - Se `gateway.auth.token` é gerenciado por SecretRef, mas está indisponível, o doctor avisa e não o sobrescreve com texto simples.
    - `openclaw doctor --generate-gateway-token` força a geração apenas quando nenhum SecretRef de token está configurado.

  </Accordion>
  <Accordion title="12b. Reparos somente leitura cientes de SecretRef">
    Alguns fluxos de reparo precisam inspecionar credenciais configuradas sem enfraquecer o comportamento fail-fast do runtime.

    - `openclaw doctor --fix` agora usa o mesmo modelo de resumo SecretRef somente leitura que os comandos da família de status para reparos direcionados de configuração.
    - Exemplo: o reparo de `allowFrom` / `groupAllowFrom` `@username` do Telegram tenta usar credenciais configuradas do bot quando disponíveis.
    - Se o token do bot Telegram estiver configurado via SecretRef, mas indisponível no caminho de comando atual, o doctor informa que a credencial está configurada, mas indisponível, e ignora a resolução automática em vez de falhar ou informar incorretamente o token como ausente.

  </Accordion>
  <Accordion title="13. Verificação de integridade do Gateway + reinício">
    O diagnóstico executa uma verificação de integridade e oferece reiniciar o Gateway quando ele parece não estar saudável.
  </Accordion>
  <Accordion title="13b. Prontidão da busca de memória">
    O diagnóstico verifica se o provedor configurado de embeddings para busca de memória está pronto para o agente padrão. O comportamento depende do backend e do provedor configurados:

    - **Backend QMD**: verifica se o binário `qmd` está disponível e pode ser iniciado. Caso contrário, imprime orientações de correção, incluindo o pacote npm e uma opção de caminho manual para o binário.
    - **Provedor local explícito**: verifica se há um arquivo de modelo local ou uma URL reconhecida de modelo remoto/baixável. Se estiver ausente, sugere mudar para um provedor remoto.
    - **Provedor remoto explícito** (`openai`, `voyage`, etc.): verifica se há uma chave de API presente no ambiente ou no armazenamento de autenticação. Imprime dicas de correção acionáveis se estiver ausente.
    - **Provedor automático**: verifica primeiro a disponibilidade do modelo local e depois tenta cada provedor remoto na ordem de seleção automática.

    Quando um resultado de sondagem do Gateway em cache está disponível (o Gateway estava saudável no momento da verificação), o diagnóstico cruza seu resultado com a configuração visível pela CLI e observa qualquer discrepância. O diagnóstico não inicia um novo ping de embedding no caminho padrão; use o comando profundo de status de memória quando quiser uma verificação ao vivo do provedor.

    Use `openclaw memory status --deep` para verificar a prontidão de embeddings em tempo de execução.

  </Accordion>
  <Accordion title="14. Avisos de status de canais">
    Se o Gateway estiver saudável, o diagnóstico executa uma sondagem de status de canal e relata avisos com correções sugeridas.
  </Accordion>
  <Accordion title="15. Auditoria + reparo da configuração do supervisor">
    O diagnóstico verifica a configuração instalada do supervisor (launchd/systemd/schtasks) em busca de padrões ausentes ou desatualizados (por exemplo, dependências systemd network-online e atraso de reinício). Quando encontra uma incompatibilidade, recomenda uma atualização e pode reescrever o arquivo de serviço/tarefa para os padrões atuais.

    Observações:

    - `openclaw doctor` solicita confirmação antes de reescrever a configuração do supervisor.
    - `openclaw doctor --yes` aceita os prompts de reparo padrão.
    - `openclaw doctor --repair` aplica as correções recomendadas sem prompts.
    - `openclaw doctor --repair --force` sobrescreve configurações personalizadas do supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantém o diagnóstico somente leitura para o ciclo de vida do serviço do Gateway. Ele ainda relata a integridade do serviço e executa reparos não relacionados ao serviço, mas ignora instalação/inicialização/reinicialização/bootstrap do serviço, reescritas da configuração do supervisor e limpeza de serviço legado porque um supervisor externo controla esse ciclo de vida.
    - No Linux, o diagnóstico não reescreve metadados de comando/ponto de entrada enquanto a unidade systemd correspondente do Gateway está ativa. Ele também ignora unidades extras inativas não legadas semelhantes ao Gateway durante a varredura de serviços duplicados, para que arquivos de serviço auxiliares não gerem ruído de limpeza.
    - Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação/reparo do serviço pelo diagnóstico valida o SecretRef, mas não persiste valores de token em texto puro resolvidos nos metadados de ambiente do serviço do supervisor.
    - O diagnóstico detecta valores de ambiente de serviço gerenciado por `.env`/SecretRef que instalações antigas de LaunchAgent, systemd ou Tarefa Agendada do Windows incorporaram inline e reescreve os metadados do serviço para que esses valores sejam carregados da fonte de runtime em vez da definição do supervisor.
    - O diagnóstico detecta quando o comando de serviço ainda fixa um `--port` antigo depois que `gateway.port` muda e reescreve os metadados do serviço para a porta atual.
    - Se a autenticação por token exigir um token e o SecretRef de token configurado não puder ser resolvido, o diagnóstico bloqueia o caminho de instalação/reparo com orientações acionáveis.
    - Se tanto `gateway.auth.token` quanto `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, o diagnóstico bloqueia a instalação/reparo até que o modo seja definido explicitamente.
    - Para unidades systemd de usuário no Linux, as verificações de divergência de token do diagnóstico agora incluem fontes `Environment=` e `EnvironmentFile=` ao comparar metadados de autenticação do serviço.
    - Os reparos de serviço do diagnóstico se recusam a reescrever, parar ou reiniciar um serviço de Gateway a partir de um binário OpenClaw mais antigo quando a configuração foi gravada pela última vez por uma versão mais nova. Consulte [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Você sempre pode forçar uma reescrita completa via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnósticos de runtime + porta do Gateway">
    O diagnóstico inspeciona o runtime do serviço (PID, último status de saída) e avisa quando o serviço está instalado, mas não está realmente em execução. Ele também verifica colisões de porta na porta do Gateway (padrão `18789`) e relata causas prováveis (Gateway já em execução, túnel SSH).
  </Accordion>
  <Accordion title="17. Boas práticas de runtime do Gateway">
    O diagnóstico avisa quando o serviço do Gateway é executado no Bun ou em um caminho de Node gerenciado por versão (`nvm`, `fnm`, `volta`, `asdf`, etc.). Os canais WhatsApp + Telegram exigem Node, e caminhos de gerenciadores de versão podem quebrar após atualizações porque o serviço não carrega a inicialização do seu shell. O diagnóstico oferece migrar para uma instalação de Node do sistema quando disponível (Homebrew/apt/choco).

    LaunchAgents do macOS recém-instalados ou reparados usam um PATH de sistema canônico (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) em vez de copiar o PATH do shell interativo, para que Volta, asdf, fnm, pnpm e outros diretórios de gerenciadores de versão não alterem qual Node os processos filhos resolvem. Serviços Linux ainda mantêm raízes de ambiente explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e diretórios user-bin estáveis, mas diretórios de fallback inferidos de gerenciadores de versão só são gravados no PATH do serviço quando esses diretórios existem no disco.

  </Accordion>
  <Accordion title="18. Gravação de configuração + metadados do assistente">
    O diagnóstico persiste quaisquer alterações de configuração e registra metadados do assistente para registrar a execução do diagnóstico.
  </Accordion>
  <Accordion title="19. Dicas de workspace (backup + sistema de memória)">
    O diagnóstico sugere um sistema de memória de workspace quando ausente e imprime uma dica de backup se o workspace ainda não estiver sob git.

    Consulte [/concepts/agent-workspace](/pt-BR/concepts/agent-workspace) para um guia completo sobre estrutura de workspace e backup com git (GitHub ou GitLab privado recomendado).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Runbook do Gateway](/pt-BR/gateway)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
