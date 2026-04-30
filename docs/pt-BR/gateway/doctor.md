---
read_when:
    - Adicionar ou modificar migrações do doctor
    - Introduzindo alterações incompatíveis na configuração
sidebarTitle: Doctor
summary: 'Comando Doctor: verificações de integridade, migrações de configuração e etapas de reparo'
title: Diagnóstico
x-i18n:
    generated_at: "2026-04-30T16:28:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89150fe2b2848f1f168b42ca6b240bc0e6a0edee4f1bcad7f79d297face9c95e
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

    Aceita os padrões sem perguntar (incluindo etapas de reparo de reinício/serviço/sandbox quando aplicável).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Aplica os reparos recomendados sem perguntar (reparos + reinícios quando seguro).

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

    Executa sem prompts e aplica apenas migrações seguras (normalização de configuração + movimentações de estado em disco). Ignora ações de reinício/serviço/sandbox que exigem confirmação humana. Migrações de estado legado são executadas automaticamente quando detectadas.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Examina serviços do sistema em busca de instalações extras do Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se quiser revisar as alterações antes de gravar, abra o arquivo de configuração primeiro:

```bash
cat ~/.openclaw/openclaw.json
```

## O que ele faz (resumo)

<AccordionGroup>
  <Accordion title="Integridade, UI e atualizações">
    - Atualização opcional de pré-execução para instalações via git (somente interativo).
    - Verificação de atualização do protocolo da UI (recompila a Control UI quando o esquema de protocolo é mais recente).
    - Verificação de integridade + prompt de reinício.
    - Resumo de status de Skills (elegíveis/ausentes/bloqueadas) e status de Plugin.

  </Accordion>
  <Accordion title="Configuração e migrações">
    - Normalização de configuração para valores legados.
    - Migração da configuração do Talk de campos planos legados `talk.*` para `talk.provider` + `talk.providers.<provider>`.
    - Verificações de migração de navegador para configurações legadas da extensão do Chrome e prontidão do Chrome MCP.
    - Avisos de substituição do provedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avisos de sombreamento do OAuth do Codex (`models.providers.openai-codex`).
    - Verificação de pré-requisitos de TLS do OAuth para perfis OAuth do OpenAI Codex.
    - Migração de estado legado em disco (sessões/diretório do agente/autenticação do WhatsApp).
    - Migração de chaves legadas do contrato de manifesto de Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migração da store de Cron legada (`jobId`, `schedule.cron`, campos de entrega/payload de nível superior, payload `provider`, jobs simples de fallback de Webhook `notify: true`).
    - Migração da política de runtime legada do agente para `agents.defaults.agentRuntime` e `agents.list[].agentRuntime`.
    - Limpeza de configuração obsoleta de Plugin quando plugins estão habilitados; quando `plugins.enabled=false`, referências obsoletas de Plugin são tratadas como configuração inerte de contenção e são preservadas.

  </Accordion>
  <Accordion title="Estado e integridade">
    - Inspeção de arquivos de lock de sessão e limpeza de locks obsoletos.
    - Reparo de transcritos de sessão para ramificações duplicadas de reescrita de prompt criadas por builds 2026.4.24 afetadas.
    - Detecção de tombstones de recuperação por reinício de subagentes travados, com suporte a `--fix` para limpar flags obsoletas de recuperação abortada, para que a inicialização não continue tratando o filho como abortado por reinício.
    - Verificações de integridade de estado e permissões (sessões, transcritos, diretório de estado).
    - Verificações de permissão do arquivo de configuração (chmod 600) ao executar localmente.
    - Integridade da autenticação de modelo: verifica expiração de OAuth, pode atualizar tokens prestes a expirar e relata estados de cooldown/desabilitação de perfis de autenticação.
    - Detecção de diretório extra de workspace (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, serviços e supervisores">
    - Reparo da imagem de sandbox quando sandboxing está habilitado.
    - Migração de serviço legado e detecção de Gateway extra.
    - Migração de estado legado do canal Matrix (no modo `--fix` / `--repair`).
    - Verificações de runtime do Gateway (serviço instalado, mas não em execução; rótulo launchd em cache).
    - Avisos de status de canal (sondados a partir do Gateway em execução).
    - Auditoria de configuração de supervisor (launchd/systemd/schtasks) com reparo opcional.
    - Limpeza de ambiente de proxy embutido para serviços do Gateway que capturaram valores shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante a instalação ou atualização.
    - Verificações de melhores práticas de runtime do Gateway (Node vs Bun, caminhos de gerenciador de versões).
    - Diagnósticos de colisão de porta do Gateway (padrão `18789`).

  </Accordion>
  <Accordion title="Autenticação, segurança e pareamento">
    - Avisos de segurança para políticas abertas de DM.
    - Verificações de autenticação do Gateway para modo de token local (oferece geração de token quando não existe fonte de token; não sobrescreve configurações SecretRef de token).
    - Detecção de problemas de pareamento de dispositivo (solicitações pendentes de pareamento inicial, upgrades pendentes de função/escopo, divergência de cache local obsoleto de token de dispositivo e divergência de autenticação de registro pareado).

  </Accordion>
  <Accordion title="Workspace e shell">
    - Verificação de linger do systemd no Linux.
    - Verificação de tamanho do arquivo de bootstrap do workspace (avisos de truncamento/quase limite para arquivos de contexto).
    - Verificação de status de conclusão do shell e instalação/upgrade automático.
    - Verificação de prontidão do provedor de embeddings de busca de memória (modelo local, chave de API remota ou binário QMD).
    - Verificações de instalação a partir do código-fonte (incompatibilidade de workspace pnpm, assets de UI ausentes, binário tsx ausente).
    - Grava configuração atualizada + metadados do assistente.

  </Accordion>
</AccordionGroup>

## Preenchimento retroativo e redefinição da UI Dreams

A cena Dreams da Control UI inclui ações **Backfill**, **Reset** e **Clear Grounded** para o fluxo de trabalho de Dreaming fundamentado. Essas ações usam métodos RPC no estilo do Gateway doctor, mas **não** fazem parte do reparo/migração da CLI `openclaw doctor`.

O que elas fazem:

- **Backfill** examina arquivos históricos `memory/YYYY-MM-DD.md` no workspace ativo, executa a passagem de diário REM fundamentada e grava entradas reversíveis de preenchimento retroativo em `DREAMS.md`.
- **Reset** remove apenas essas entradas marcadas de diário de preenchimento retroativo de `DREAMS.md`.
- **Clear Grounded** remove apenas entradas encenadas de curto prazo somente fundamentadas que vieram de replay histórico e ainda não acumularam recall ao vivo ou suporte diário.

O que elas **não** fazem por si mesmas:

- elas não editam `MEMORY.md`
- elas não executam migrações completas do doctor
- elas não encenam automaticamente candidatos fundamentados na store de promoção de curto prazo ao vivo, a menos que você execute explicitamente o caminho da CLI encenado primeiro

Se quiser que o replay histórico fundamentado influencie a lane normal de promoção profunda, use o fluxo da CLI em vez disso:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Isso encena candidatos duráveis fundamentados na store de Dreaming de curto prazo, mantendo `DREAMS.md` como superfície de revisão.

## Comportamento detalhado e justificativa

<AccordionGroup>
  <Accordion title="0. Atualização opcional (instalações via git)">
    Se este for um checkout git e o doctor estiver sendo executado interativamente, ele oferecerá uma atualização (fetch/rebase/build) antes de executar o doctor.
  </Accordion>
  <Accordion title="1. Normalização de configuração">
    Se a configuração contiver formatos de valores legados (por exemplo, `messages.ackReaction` sem uma substituição específica de canal), o doctor os normaliza para o esquema atual.

    Isso inclui campos planos legados do Talk. A configuração pública atual do Talk é `talk.provider` + `talk.providers.<provider>`. O doctor reescreve formatos antigos `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` no mapa de provedores.

  </Accordion>
  <Accordion title="2. Migrações de chaves de configuração legadas">
    Quando a configuração contém chaves obsoletas, outros comandos se recusam a executar e pedem que você execute `openclaw doctor`.

    O doctor irá:

    - Explicar quais chaves legadas foram encontradas.
    - Mostrar a migração aplicada.
    - Reescrever `~/.openclaw/openclaw.json` com o esquema atualizado.

    O Gateway também executa migrações do doctor automaticamente na inicialização quando detecta um formato de configuração legado, para que configurações obsoletas sejam reparadas sem intervenção manual. Migrações da store de jobs Cron são tratadas por `openclaw doctor --fix`.

    Migrações atuais:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
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
    - Para canais com `accounts` nomeadas, mas valores de canal de nível superior de conta única remanescentes, move esses valores com escopo de conta para a conta promovida escolhida para esse canal (`accounts.default` para a maioria dos canais; Matrix pode preservar um destino nomeado/padrão correspondente existente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - remove `agents.defaults.llm`; use `models.providers.<id>.timeoutSeconds` para timeouts de provedor/modelo lentos
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - remove `browser.relayBindHost` (configuração legada de relay da extensão)
    - `models.providers.*.api: "openai"` legado → `"openai-completions"` (a inicialização do gateway também ignora provedores cujo `api` está definido como valor de enum futuro ou desconhecido, em vez de falhar fechado)

    Os avisos do doctor também incluem orientação de padrão de conta para canais com várias contas:

    - Se duas ou mais entradas `channels.<channel>.accounts` estiverem configuradas sem `channels.<channel>.defaultAccount` ou `accounts.default`, o doctor avisa que o roteamento de fallback pode escolher uma conta inesperada.
    - Se `channels.<channel>.defaultAccount` estiver definido como um ID de conta desconhecido, o doctor avisa e lista os IDs de conta configurados.

  </Accordion>
  <Accordion title="2b. Substituições do provedor OpenCode">
    Se você adicionou `models.providers.opencode`, `opencode-zen` ou `opencode-go` manualmente, isso substitui o catálogo OpenCode integrado de `@mariozechner/pi-ai`. Isso pode forçar modelos para a API errada ou zerar custos. O doctor avisa para que você possa remover a substituição e restaurar o roteamento de API + custos por modelo.
  </Accordion>
  <Accordion title="2c. Migração do navegador e prontidão do Chrome MCP">
    Se sua configuração de navegador ainda aponta para o caminho removido da extensão do Chrome, o doctor a normaliza para o modelo atual de anexação do Chrome MCP local ao host:

    - `browser.profiles.*.driver: "extension"` vira `"existing-session"`
    - `browser.relayBindHost` é removido

    O doctor também audita o caminho do Chrome MCP local ao host quando você usa `defaultProfile: "user"` ou um perfil `existing-session` configurado:

    - verifica se o Google Chrome está instalado no mesmo host para perfis padrão de conexão automática
    - verifica a versão detectada do Chrome e avisa quando ela está abaixo do Chrome 144
    - lembra você de habilitar a depuração remota na página de inspeção do navegador (por exemplo, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    O doctor não pode habilitar a configuração do lado do Chrome para você. O Chrome MCP local ao host ainda exige:

    - um navegador baseado em Chromium 144+ no host do gateway/node
    - o navegador em execução localmente
    - depuração remota habilitada nesse navegador
    - aprovar o primeiro prompt de consentimento de anexação no navegador

    A prontidão aqui trata apenas dos pré-requisitos de anexação local. Existing-session mantém os limites atuais de rota do Chrome MCP; rotas avançadas como `responsebody`, exportação de PDF, interceptação de downloads e ações em lote ainda exigem um navegador gerenciado ou perfil CDP bruto.

    Esta verificação **não** se aplica a Docker, sandbox, remote-browser ou outros fluxos headless. Esses continuam usando CDP bruto.

  </Accordion>
  <Accordion title="2d. Pré-requisitos de TLS do OAuth">
    Quando um perfil OAuth do OpenAI Codex está configurado, o doctor sonda o endpoint de autorização da OpenAI para verificar se a pilha TLS local do Node/OpenSSL consegue validar a cadeia de certificados. Se a sondagem falhar com um erro de certificado (por exemplo, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado expirado ou certificado autoassinado), o doctor imprime orientações de correção específicas da plataforma. No macOS com um Node do Homebrew, a correção geralmente é `brew postinstall ca-certificates`. Com `--deep`, a sondagem é executada mesmo se o gateway estiver íntegro.
  </Accordion>
  <Accordion title="2e. Substituições do provedor OAuth do Codex">
    Se você adicionou anteriormente configurações legadas de transporte da OpenAI em `models.providers.openai-codex`, elas podem mascarar o caminho do provedor OAuth do Codex integrado que versões mais novas usam automaticamente. O doctor avisa quando encontra essas configurações antigas de transporte junto com OAuth do Codex, para que você possa remover ou reescrever a substituição de transporte obsoleta e recuperar o comportamento integrado de roteamento/fallback. Proxies personalizados e substituições apenas de cabeçalho ainda são compatíveis e não acionam este aviso.
  </Accordion>
  <Accordion title="2f. Avisos de rota do Plugin Codex">
    Quando o Plugin Codex incluído está habilitado, o doctor também verifica se referências de modelo primário `openai-codex/*` ainda são resolvidas pelo executor PI padrão. Essa combinação é válida quando você quer autenticação OAuth/assinatura do Codex via PI, mas é fácil confundi-la com o harness app-server nativo do Codex. O doctor avisa e aponta para a forma explícita de app-server: `openai/*` mais `agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex`.

    O doctor não repara isso automaticamente porque ambas as rotas são válidas:

    - `openai-codex/*` + PI significa "usar autenticação OAuth/assinatura do Codex pelo executor normal do OpenClaw."
    - `openai/*` + `runtime: "codex"` significa "executar o turno embutido pelo app-server nativo do Codex."
    - `/codex ...` significa "controlar ou vincular uma conversa nativa do Codex pelo chat."
    - `/acp ...` ou `runtime: "acp"` significa "usar o adaptador externo ACP/acpx."

    Se o aviso aparecer, escolha a rota que você pretendia e edite a configuração manualmente. Mantenha o aviso como está quando o OAuth do Codex via PI for intencional.

  </Accordion>
  <Accordion title="3. Migrações de estado legado (layout em disco)">
    O doctor pode migrar layouts antigos em disco para a estrutura atual:

    - Armazenamento de sessões + transcrições:
      - de `~/.openclaw/sessions/` para `~/.openclaw/agents/<agentId>/sessions/`
    - Diretório do agente:
      - de `~/.openclaw/agent/` para `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticação do WhatsApp (Baileys):
      - de `~/.openclaw/credentials/*.json` legado (exceto `oauth.json`)
      - para `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID da conta padrão: `default`)

    Essas migrações são de melhor esforço e idempotentes; o doctor emitirá avisos quando deixar pastas legadas para trás como backups. O Gateway/CLI também migra automaticamente as sessões legadas + o diretório do agente na inicialização, para que histórico/autenticação/modelos cheguem ao caminho por agente sem uma execução manual do doctor. A autenticação do WhatsApp é migrada intencionalmente apenas via `openclaw doctor`. A normalização de provedor/mapa de provedores de conversa agora compara por igualdade estrutural, então diffs apenas de ordem de chaves não acionam mais alterações repetidas sem efeito de `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migrações de manifestos legados de Plugin">
    O doctor verifica todos os manifestos de Plugin instalados em busca de chaves de capacidade de nível superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando encontradas, ele oferece movê-las para o objeto `contracts` e reescrever o arquivo de manifesto no local. Esta migração é idempotente; se a chave `contracts` já tiver os mesmos valores, a chave legada será removida sem duplicar os dados.
  </Accordion>
  <Accordion title="3b. Migrações do armazenamento de Cron legado">
    O doctor também verifica o armazenamento de tarefas cron (`~/.openclaw/cron/jobs.json` por padrão, ou `cron.store` quando substituído) em busca de formatos antigos de tarefa que o agendador ainda aceita por compatibilidade.

    As limpezas de cron atuais incluem:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de payload de nível superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nível superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliases de entrega `provider` do payload → `delivery.channel` explícito
    - tarefas webhook simples legadas de fallback `notify: true` → `delivery.mode="webhook"` explícito com `delivery.to=cron.webhook`

    O doctor só migra automaticamente tarefas `notify: true` quando consegue fazer isso sem alterar o comportamento. Se uma tarefa combina fallback legado de notify com um modo de entrega não webhook existente, o doctor avisa e deixa essa tarefa para revisão manual.

  </Accordion>
  <Accordion title="3c. Limpeza de bloqueios de sessão">
    O doctor verifica cada diretório de sessão de agente em busca de arquivos de bloqueio de escrita obsoletos — arquivos deixados para trás quando uma sessão encerrou de forma anormal. Para cada arquivo de bloqueio encontrado, ele relata: o caminho, PID, se o PID ainda está ativo, idade do bloqueio e se ele é considerado obsoleto (PID morto ou mais antigo que 30 minutos). No modo `--fix` / `--repair`, ele remove arquivos de bloqueio obsoletos automaticamente; caso contrário, imprime uma observação e instrui você a executar novamente com `--fix`.
  </Accordion>
  <Accordion title="3d. Reparo de ramificação de transcrição de sessão">
    O doctor verifica arquivos JSONL de sessão de agente em busca do formato de ramificação duplicada criado pelo bug de reescrita de transcrição de prompt de 2026.4.24: um turno de usuário abandonado com contexto interno de runtime do OpenClaw mais um irmão ativo contendo o mesmo prompt de usuário visível. No modo `--fix` / `--repair`, o doctor faz backup de cada arquivo afetado ao lado do original e reescreve a transcrição para a ramificação ativa, para que o histórico do gateway e os leitores de memória não vejam mais turnos duplicados.
  </Accordion>
  <Accordion title="4. Verificações de integridade do estado (persistência de sessão, roteamento e segurança)">
    O diretório de estado é o tronco cerebral operacional. Se ele desaparecer, você perde sessões, credenciais, logs e configuração (a menos que tenha backups em outro lugar).

    O doctor verifica:

    - **Diretório de estado ausente**: avisa sobre perda catastrófica de estado, pede para recriar o diretório e lembra que não consegue recuperar dados ausentes.
    - **Permissões do diretório de estado**: verifica capacidade de escrita; oferece reparar permissões (e emite uma dica de `chown` quando uma divergência de proprietário/grupo é detectada).
    - **Diretório de estado sincronizado em nuvem no macOS**: avisa quando o estado é resolvido em iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...`, porque caminhos com sincronização podem causar E/S mais lenta e corridas de bloqueio/sincronização.
    - **Diretório de estado em SD ou eMMC no Linux**: avisa quando o estado é resolvido para uma fonte de montagem `mmcblk*`, porque E/S aleatória apoiada por SD ou eMMC pode ser mais lenta e desgastar mais rapidamente sob escritas de sessões e credenciais.
    - **Diretórios de sessão ausentes**: `sessions/` e o diretório de armazenamento de sessões são necessários para persistir histórico e evitar falhas `ENOENT`.
    - **Incompatibilidade de transcrição**: avisa quando entradas recentes de sessão têm arquivos de transcrição ausentes.
    - **Sessão principal "JSONL de 1 linha"**: sinaliza quando a transcrição principal tem apenas uma linha (o histórico não está acumulando).
    - **Múltiplos diretórios de estado**: avisa quando múltiplas pastas `~/.openclaw` existem em diretórios home ou quando `OPENCLAW_STATE_DIR` aponta para outro lugar (o histórico pode se dividir entre instalações).
    - **Lembrete de modo remoto**: se `gateway.mode=remote`, o doctor lembra você de executá-lo no host remoto (o estado fica lá).
    - **Permissões do arquivo de configuração**: avisa se `~/.openclaw/openclaw.json` está legível por grupo/mundo e oferece restringir para `600`.

  </Accordion>
  <Accordion title="5. Saúde de autenticação de modelo (expiração de OAuth)">
    O doctor inspeciona perfis OAuth no armazenamento de autenticação, avisa quando tokens estão expirando/expirados e pode atualizá-los quando for seguro. Se o perfil OAuth/token da Anthropic estiver obsoleto, ele sugere uma chave de API da Anthropic ou o caminho de setup-token da Anthropic. Prompts de atualização aparecem apenas quando executado interativamente (TTY); `--non-interactive` ignora tentativas de atualização.

    Quando uma atualização de OAuth falha permanentemente (por exemplo, `refresh_token_reused`, `invalid_grant` ou um provedor dizendo para você entrar novamente), o doctor informa que uma nova autenticação é necessária e imprime o comando exato `openclaw models auth login --provider ...` a ser executado.

    O doctor também relata perfis de autenticação que estão temporariamente inutilizáveis devido a:

    - cooldowns curtos (limites de taxa/timeouts/falhas de autenticação)
    - desativações mais longas (falhas de cobrança/crédito)

  </Accordion>
  <Accordion title="6. Validação do modelo de hooks">
    Se `hooks.gmail.model` estiver definido, o doctor valida a referência do modelo em relação ao catálogo e à allowlist e avisa quando ela não puder ser resolvida ou não for permitida.
  </Accordion>
  <Accordion title="7. Reparo de imagem de sandbox">
    Quando o sandboxing está habilitado, o doctor verifica as imagens Docker e oferece criar ou alternar para nomes legados se a imagem atual estiver ausente.
  </Accordion>
  <Accordion title="7b. Dependências de runtime de plugins incluídos">
    O Doctor verifica dependências de runtime apenas para plugins incluídos que estão ativos na configuração atual ou habilitados pelo padrão do manifesto incluído, por exemplo `plugins.entries.discord.enabled: true`, o legado `channels.discord.enabled: true`, `models.providers.*` configurados / referências de modelo de agente, ou um plugin incluído habilitado por padrão sem propriedade de provedor. Se alguma estiver ausente, o doctor informa os pacotes e os instala no modo `openclaw doctor --fix` / `openclaw doctor --repair`. Plugins externos ainda usam `openclaw plugins install` / `openclaw plugins update`; o doctor não instala dependências para caminhos arbitrários de plugins.

    Durante o reparo do doctor, instalações npm de dependências de runtime incluídas relatam progresso por spinner em sessões TTY e progresso periódico em linhas em saída canalizada/headless. O Gateway e a CLI local também podem reparar dependências de runtime de plugins incluídos ativos sob demanda antes de importar um plugin incluído. Essas instalações ficam restritas à raiz de instalação do runtime do plugin, executam com scripts desabilitados, não gravam um package lock e são protegidas por um bloqueio da raiz de instalação para que inicializações simultâneas da CLI ou do Gateway não alterem a mesma árvore `node_modules` ao mesmo tempo.

  </Accordion>
  <Accordion title="8. Migrações de serviço do Gateway e dicas de limpeza">
    O Doctor detecta serviços de gateway legados (launchd/systemd/schtasks) e oferece removê-los e instalar o serviço do OpenClaw usando a porta atual do gateway. Ele também pode verificar serviços extras semelhantes ao gateway e imprimir dicas de limpeza. Serviços de gateway do OpenClaw nomeados por perfil são considerados de primeira classe e não são marcados como "extras".

    No Linux, se o serviço de gateway em nível de usuário estiver ausente, mas existir um serviço de gateway do OpenClaw em nível de sistema, o doctor não instala automaticamente um segundo serviço em nível de usuário. Inspecione com `openclaw gateway status --deep` ou `openclaw doctor --deep`, depois remova a duplicata ou defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando um supervisor de sistema for responsável pelo ciclo de vida do gateway.

  </Accordion>
  <Accordion title="8b. Migração de inicialização do Matrix">
    Quando uma conta de canal Matrix tem uma migração de estado legado pendente ou acionável, o doctor (no modo `--fix` / `--repair`) cria um snapshot pré-migração e depois executa as etapas de migração de melhor esforço: migração de estado legado do Matrix e preparação de estado criptografado legado. Ambas as etapas não são fatais; erros são registrados e a inicialização continua. No modo somente leitura (`openclaw doctor` sem `--fix`), essa verificação é totalmente ignorada.
  </Accordion>
  <Accordion title="8c. Pareamento de dispositivos e desvio de autenticação">
    O Doctor agora inspeciona o estado de pareamento de dispositivos como parte da passagem normal de saúde.

    O que ele relata:

    - solicitações pendentes de primeiro pareamento
    - upgrades de função pendentes para dispositivos já pareados
    - upgrades de escopo pendentes para dispositivos já pareados
    - reparos de incompatibilidade de chave pública em que o id do dispositivo ainda corresponde, mas a identidade do dispositivo não corresponde mais ao registro aprovado
    - registros pareados sem um token ativo para uma função aprovada
    - tokens pareados cujos escopos desviaram da linha de base de pareamento aprovada
    - entradas locais em cache de token de dispositivo para a máquina atual anteriores a uma rotação de token no lado do gateway ou com metadados de escopo obsoletos

    O Doctor não aprova automaticamente solicitações de pareamento nem rotaciona automaticamente tokens de dispositivo. Em vez disso, ele imprime os próximos passos exatos:

    - inspecione solicitações pendentes com `openclaw devices list`
    - aprove a solicitação exata com `openclaw devices approve <requestId>`
    - rotacione um token novo com `openclaw devices rotate --device <deviceId> --role <role>`
    - remova e aprove novamente um registro obsoleto com `openclaw devices remove <deviceId>`

    Isso fecha a lacuna comum de "já pareado, mas ainda recebendo pareamento obrigatório": o doctor agora distingue primeiro pareamento de upgrades pendentes de função/escopo e de desvio de token/identidade de dispositivo obsoleto.

  </Accordion>
  <Accordion title="9. Avisos de segurança">
    O Doctor emite avisos quando um provedor está aberto a DMs sem uma allowlist, ou quando uma política está configurada de forma perigosa.
  </Accordion>
  <Accordion title="10. Linger do systemd (Linux)">
    Se estiver executando como um serviço de usuário do systemd, o doctor garante que o lingering esteja habilitado para que o gateway permaneça ativo após o logout.
  </Accordion>
  <Accordion title="11. Status do workspace (skills, plugins e diretórios legados)">
    O Doctor imprime um resumo do estado do workspace para o agente padrão:

    - **Status de Skills**: conta skills elegíveis, com requisitos ausentes e bloqueadas por allowlist.
    - **Diretórios legados de workspace**: avisa quando `~/openclaw` ou outros diretórios legados de workspace existem ao lado do workspace atual.
    - **Status de Plugin**: conta plugins habilitados/desabilitados/com erro; lista IDs de plugins para quaisquer erros; relata capacidades de plugins do bundle.
    - **Avisos de compatibilidade de Plugin**: sinaliza plugins que têm problemas de compatibilidade com o runtime atual.
    - **Diagnósticos de Plugin**: expõe quaisquer avisos ou erros de tempo de carregamento emitidos pelo registro de plugins.

  </Accordion>
  <Accordion title="11b. Tamanho do arquivo de bootstrap">
    O Doctor verifica se os arquivos de bootstrap do workspace (por exemplo `AGENTS.md`, `CLAUDE.md` ou outros arquivos de contexto injetados) estão próximos ou acima do orçamento de caracteres configurado. Ele relata contagens por arquivo de caracteres brutos vs. injetados, percentual de truncamento, causa do truncamento (`max/file` ou `max/total`) e total de caracteres injetados como fração do orçamento total. Quando os arquivos são truncados ou se aproximam do limite, o doctor imprime dicas para ajustar `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Limpeza de plugin de canal obsoleto">
    Quando `openclaw doctor --fix` remove um plugin de canal ausente, ele também remove a configuração pendente com escopo de canal que referenciava esse plugin: entradas `channels.<id>`, alvos de Heartbeat que nomeavam o canal e substituições `agents.*.models["<channel>/*"]`. Isso evita loops de inicialização do Gateway em que o runtime do canal desapareceu, mas a configuração ainda pede que o gateway se vincule a ele.
  </Accordion>
  <Accordion title="11c. Autocompletar do shell">
    O Doctor verifica se a conclusão por tab está instalada para o shell atual (zsh, bash, fish ou PowerShell):

    - Se o perfil do shell usa um padrão lento de conclusão dinâmica (`source <(openclaw completion ...)`), o doctor o atualiza para a variante mais rápida de arquivo em cache.
    - Se a conclusão está configurada no perfil, mas o arquivo de cache está ausente, o doctor regenera o cache automaticamente.
    - Se nenhuma conclusão está configurada, o doctor solicita a instalação (somente no modo interativo; ignorado com `--non-interactive`).

    Execute `openclaw completion --write-state` para regenerar o cache manualmente.

  </Accordion>
  <Accordion title="12. Verificações de autenticação do Gateway (token local)">
    O Doctor verifica a prontidão da autenticação por token do gateway local.

    - Se o modo de token precisa de um token e não existe fonte de token, o doctor oferece gerar um.
    - Se `gateway.auth.token` é gerenciado por SecretRef, mas está indisponível, o doctor avisa e não o sobrescreve com texto simples.
    - `openclaw doctor --generate-gateway-token` força a geração apenas quando nenhum SecretRef de token está configurado.

  </Accordion>
  <Accordion title="12b. Reparos somente leitura cientes de SecretRef">
    Alguns fluxos de reparo precisam inspecionar credenciais configuradas sem enfraquecer o comportamento de falha rápida do runtime.

    - `openclaw doctor --fix` agora usa o mesmo modelo de resumo somente leitura de SecretRef que os comandos da família de status para reparos de configuração direcionados.
    - Exemplo: o reparo de `allowFrom` / `groupAllowFrom` `@username` do Telegram tenta usar as credenciais de bot configuradas quando disponíveis.
    - Se o token do bot do Telegram estiver configurado via SecretRef, mas indisponível no caminho do comando atual, o doctor relata que a credencial está configurada-mas-indisponível e ignora a resolução automática em vez de travar ou relatar incorretamente que o token está ausente.

  </Accordion>
  <Accordion title="13. Verificação de saúde do Gateway + reinicialização">
    O Doctor executa uma verificação de saúde e oferece reiniciar o gateway quando ele parece não saudável.
  </Accordion>
  <Accordion title="13b. Prontidão da busca de memória">
    O Doctor verifica se o provedor de embeddings de busca de memória configurado está pronto para o agente padrão. O comportamento depende do backend e do provedor configurados:

    - **Backend QMD**: verifica se o binário `qmd` está disponível e pode ser iniciado. Se não, imprime orientação de correção incluindo o pacote npm e uma opção de caminho manual para o binário.
    - **Provedor local explícito**: verifica se há um arquivo de modelo local ou uma URL de modelo remoto/baixável reconhecida. Se estiver ausente, sugere alternar para um provedor remoto.
    - **Provedor remoto explícito** (`openai`, `voyage` etc.): verifica se uma chave de API está presente no ambiente ou no armazenamento de autenticação. Imprime dicas de correção acionáveis se estiver ausente.
    - **Provedor automático**: verifica primeiro a disponibilidade do modelo local e depois tenta cada provedor remoto na ordem de seleção automática.

    Quando um resultado de sondagem do gateway em cache está disponível (o gateway estava saudável no momento da verificação), o doctor cruza seu resultado com a configuração visível pela CLI e observa qualquer discrepância. O Doctor não inicia um novo ping de embedding no caminho padrão; use o comando de status profundo de memória quando quiser uma verificação ao vivo do provedor.

    Use `openclaw memory status --deep` para verificar a prontidão de embeddings em runtime.

  </Accordion>
  <Accordion title="14. Avisos de status de canal">
    Se o gateway estiver saudável, o doctor executa uma sondagem de status de canal e relata avisos com correções sugeridas.
  </Accordion>
  <Accordion title="15. Auditoria + reparo da configuração do supervisor">
    O Doctor verifica a configuração do supervisor instalado (launchd/systemd/schtasks) em busca de padrões ausentes ou desatualizados (por exemplo, dependências de systemd network-online e atraso de reinício). Quando encontra uma incompatibilidade, ele recomenda uma atualização e pode reescrever o arquivo de serviço/tarefa para os padrões atuais.

    Observações:

    - `openclaw doctor` solicita confirmação antes de reescrever a configuração do supervisor.
    - `openclaw doctor --yes` aceita os prompts de reparo padrão.
    - `openclaw doctor --repair` aplica as correções recomendadas sem prompts.
    - `openclaw doctor --repair --force` sobrescreve configurações personalizadas do supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantém o doctor somente leitura para o ciclo de vida do serviço do Gateway. Ele ainda relata a integridade do serviço e executa reparos que não são de serviço, mas ignora instalação/início/reinício/bootstrap do serviço, reescritas de configuração do supervisor e limpeza de serviços legados porque um supervisor externo é dono desse ciclo de vida.
    - No Linux, o doctor não reescreve metadados de comando/entrypoint enquanto a unidade systemd do Gateway correspondente está ativa. Ele também ignora unidades extras inativas não legadas semelhantes ao Gateway durante a varredura de serviços duplicados, para que arquivos de serviço complementares não gerem ruído de limpeza.
    - Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação/reparo do serviço pelo doctor valida o SecretRef, mas não persiste valores de token em texto claro resolvidos nos metadados de ambiente do serviço do supervisor.
    - O Doctor detecta valores de ambiente de serviço gerenciados por `.env`/SecretRef que instalações mais antigas de LaunchAgent, systemd ou Tarefa Agendada do Windows incorporaram inline e reescreve os metadados do serviço para que esses valores sejam carregados da fonte de runtime em vez da definição do supervisor.
    - O Doctor detecta quando o comando do serviço ainda fixa um `--port` antigo depois que `gateway.port` muda e reescreve os metadados do serviço para a porta atual.
    - Se a autenticação por token exigir um token e o SecretRef de token configurado não for resolvido, o doctor bloqueia o caminho de instalação/reparo com orientação acionável.
    - Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, o doctor bloqueia a instalação/reparo até que o modo seja definido explicitamente.
    - Para unidades user-systemd no Linux, as verificações de divergência de token do doctor agora incluem fontes `Environment=` e `EnvironmentFile=` ao comparar metadados de autenticação do serviço.
    - Reparos de serviço do Doctor se recusam a reescrever, parar ou reiniciar um serviço do Gateway de um binário OpenClaw mais antigo quando a configuração foi gravada pela última vez por uma versão mais nova. Consulte [solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Você sempre pode forçar uma reescrita completa via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnóstico de runtime + porta do Gateway">
    O Doctor inspeciona o runtime do serviço (PID, último status de saída) e avisa quando o serviço está instalado, mas não está realmente em execução. Ele também verifica colisões de porta na porta do Gateway (padrão `18789`) e relata causas prováveis (Gateway já em execução, túnel SSH).
  </Accordion>
  <Accordion title="17. Práticas recomendadas de runtime do Gateway">
    O Doctor avisa quando o serviço do Gateway é executado no Bun ou em um caminho de Node gerenciado por versão (`nvm`, `fnm`, `volta`, `asdf`, etc.). Os canais WhatsApp + Telegram exigem Node, e caminhos de gerenciadores de versão podem quebrar após upgrades porque o serviço não carrega sua inicialização de shell. O Doctor oferece migração para uma instalação de Node do sistema quando disponível (Homebrew/apt/choco).

    Serviços recém-instalados ou reparados mantêm raízes de ambiente explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e diretórios user-bin estáveis, mas diretórios fallback inferidos de gerenciadores de versão só são gravados no PATH do serviço quando esses diretórios existem no disco. Isso mantém o PATH gerado do supervisor alinhado à mesma auditoria de PATH mínimo que o doctor executa depois.

  </Accordion>
  <Accordion title="18. Gravação de configuração + metadados do assistente">
    O Doctor persiste quaisquer alterações de configuração e marca metadados do assistente para registrar a execução do doctor.
  </Accordion>
  <Accordion title="19. Dicas de workspace (backup + sistema de memória)">
    O Doctor sugere um sistema de memória de workspace quando ausente e imprime uma dica de backup se o workspace ainda não estiver sob git.

    Consulte [/concepts/agent-workspace](/pt-BR/concepts/agent-workspace) para um guia completo sobre a estrutura do workspace e backup com git (recomendado GitHub ou GitLab privado).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Runbook do Gateway](/pt-BR/gateway)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
