---
read_when:
    - Adicionando ou modificando migrações do doctor
    - Introduzindo alterações incompatíveis na configuração
sidebarTitle: Doctor
summary: 'Comando doctor: verificações de integridade, migrações de configuração e etapas de reparo'
title: Doctor
x-i18n:
    generated_at: "2026-04-26T11:28:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 592a9f886e0e6dcbfeb41a09c765ab289f3ed16ed360be37ff9fbefba920754f
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` é a ferramenta de reparo + migração do OpenClaw. Ela corrige config/estado obsoletos, verifica a integridade e fornece etapas de reparo acionáveis.

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

    Aceita os padrões sem solicitar confirmação (incluindo etapas de reparo de reinicialização/serviço/sandbox, quando aplicável).

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

    Aplica também reparos agressivos (sobrescreve configs personalizadas de supervisor).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Executa sem solicitações e aplica apenas migrações seguras (normalização de config + movimentações de estado em disco). Ignora ações de reinicialização/serviço/sandbox que exigem confirmação humana. Migrações de estado legadas são executadas automaticamente quando detectadas.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Examina serviços do sistema em busca de instalações extras do gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se você quiser revisar as alterações antes de gravar, abra primeiro o arquivo de configuração:

```bash
cat ~/.openclaw/openclaw.json
```

## O que ele faz (resumo)

<AccordionGroup>
  <Accordion title="Integridade, UI e atualizações">
    - Atualização prévia opcional para instalações git (somente interativo).
    - Verificação de atualização do protocolo da UI (recompila a Control UI quando o schema do protocolo é mais novo).
    - Verificação de integridade + prompt para reinicialização.
    - Resumo de status de Skills (elegível/ausente/bloqueado) e status de plugin.
  </Accordion>
  <Accordion title="Configuração e migrações">
    - Normalização da configuração para valores legados.
    - Migração da configuração de Talk dos campos legados planos `talk.*` para `talk.provider` + `talk.providers.<provider>`.
    - Verificações de migração do browser para configs legadas da extensão do Chrome e prontidão do Chrome MCP.
    - Avisos de substituição de provedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avisos de sombreamento de OAuth do Codex (`models.providers.openai-codex`).
    - Verificação de pré-requisitos de TLS do OAuth para perfis OAuth do OpenAI Codex.
    - Migração de estado legado em disco (sessions/agent dir/auth do WhatsApp).
    - Migração de chaves legadas de contrato de manifesto de plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migração do armazenamento Cron legado (`jobId`, `schedule.cron`, campos de entrega/payload de nível superior, `provider` do payload, jobs simples de fallback de Webhook com `notify: true`).
    - Migração da política legada de runtime de agente para `agents.defaults.agentRuntime` e `agents.list[].agentRuntime`.
  </Accordion>
  <Accordion title="Estado e integridade">
    - Inspeção de arquivos de bloqueio de sessão e limpeza de locks obsoletos.
    - Reparo de transcrições de sessão para ramos duplicados de reescrita de prompt criados por builds afetadas de 2026.4.24.
    - Verificações de integridade e permissões de estado (sessions, transcripts, diretório de estado).
    - Verificações de permissões do arquivo de configuração (chmod 600) ao executar localmente.
    - Integridade de autenticação do modelo: verifica expiração do OAuth, pode atualizar tokens prestes a expirar e relata estados de cooldown/desativação de perfil de autenticação.
    - Detecção de diretório extra de workspace (`~/openclaw`).
  </Accordion>
  <Accordion title="Gateway, serviços e supervisores">
    - Reparo de imagem de sandbox quando o sandboxing está ativado.
    - Migração de serviços legados e detecção de gateways extras.
    - Migração de estado legado do canal Matrix (nos modos `--fix` / `--repair`).
    - Verificações de runtime do Gateway (serviço instalado, mas não em execução; rótulo cached do launchd).
    - Avisos de status de canal (sondados a partir do gateway em execução).
    - Auditoria de configuração de supervisor (launchd/systemd/schtasks) com reparo opcional.
    - Verificações de melhores práticas de runtime do Gateway (Node vs Bun, caminhos de gerenciador de versão).
    - Diagnóstico de colisão de porta do Gateway (padrão `18789`).
  </Accordion>
  <Accordion title="Auth, segurança e pareamento">
    - Avisos de segurança para políticas de DM abertas.
    - Verificações de autenticação do Gateway para modo de token local (oferece geração de token quando não existe uma fonte de token; não sobrescreve configs de SecretRef de token).
    - Detecção de problemas de pareamento de dispositivo (solicitações pendentes de primeiro pareamento, upgrades pendentes de função/escopo, desvio obsoleto do cache local de token de dispositivo e desvio de autenticação de registro pareado).
  </Accordion>
  <Accordion title="Workspace e shell">
    - Verificação de linger do systemd no Linux.
    - Verificação do tamanho do arquivo de bootstrap do workspace (avisos de truncamento/próximo do limite para arquivos de contexto).
    - Verificação de status de shell completion e instalação/atualização automática.
    - Verificação de prontidão do provedor de embeddings para busca em memória (modelo local, chave remota de API ou binário QMD).
    - Verificações de instalação a partir do código-fonte (incompatibilidade de workspace pnpm, assets ausentes da UI, binário tsx ausente).
    - Grava configuração atualizada + metadados do assistente.
  </Accordion>
</AccordionGroup>

## Backfill e reset da UI de Dreaming

A cena Dreams da Control UI inclui ações **Backfill**, **Reset** e **Clear Grounded** para o fluxo de grounded Dreaming. Essas ações usam métodos RPC no estilo doctor do gateway, mas **não** fazem parte do reparo/migração da CLI `openclaw doctor`.

O que elas fazem:

- **Backfill** examina arquivos históricos `memory/YYYY-MM-DD.md` no workspace ativo, executa a passagem de diário REM grounded e grava entradas reversíveis de backfill em `DREAMS.md`.
- **Reset** remove apenas essas entradas de diário de backfill marcadas de `DREAMS.md`.
- **Clear Grounded** remove apenas entradas de curto prazo apenas-grounded preparadas que vieram de replay histórico e ainda não acumularam recordação ao vivo nem suporte diário.

O que elas **não** fazem por si só:

- não editam `MEMORY.md`
- não executam migrações completas do doctor
- não preparam automaticamente candidatos grounded no armazenamento ativo de promoção de curto prazo, a menos que você execute explicitamente primeiro o caminho da CLI de staging

Se você quiser que o replay histórico grounded influencie a trilha normal de promoção profunda, use o fluxo da CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Isso prepara candidatos duráveis grounded no armazenamento de Dreaming de curto prazo, mantendo `DREAMS.md` como a superfície de revisão.

## Comportamento detalhado e justificativa

<AccordionGroup>
  <Accordion title="0. Atualização opcional (instalações git)">
    Se isto for um checkout git e o doctor estiver em execução no modo interativo, ele oferece atualizar (fetch/rebase/build) antes de executar o doctor.
  </Accordion>
  <Accordion title="1. Normalização da configuração">
    Se a config contiver formatos legados de valores (por exemplo `messages.ackReaction` sem uma substituição específica de canal), o doctor os normaliza para o schema atual.

    Isso inclui campos planos legados de Talk. A configuração pública atual de Talk é `talk.provider` + `talk.providers.<provider>`. O doctor reescreve formatos antigos de `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` no mapa de provedores.

  </Accordion>
  <Accordion title="2. Migrações de chaves legadas de configuração">
    Quando a config contém chaves obsoletas, outros comandos se recusam a executar e pedem para você executar `openclaw doctor`.

    O doctor irá:

    - Explicar quais chaves legadas foram encontradas.
    - Mostrar a migração aplicada.
    - Reescrever `~/.openclaw/openclaw.json` com o schema atualizado.

    O Gateway também executa automaticamente migrações do doctor na inicialização quando detecta um formato legado de config, para que configs obsoletas sejam reparadas sem intervenção manual. Migrações do armazenamento de jobs Cron são tratadas por `openclaw doctor --fix`.

    Migrações atuais:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` de nível superior
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
    - Para canais com `accounts` nomeadas, mas com valores de canal de conta única ainda no nível superior, mova esses valores com escopo de conta para a conta promovida escolhida para esse canal (`accounts.default` para a maioria dos canais; Matrix pode preservar um destino nomeado/default existente correspondente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - remover `browser.relayBindHost` (configuração legada de relay da extensão)

    Os avisos do doctor também incluem orientação sobre conta padrão para canais com múltiplas contas:

    - Se duas ou mais entradas `channels.<channel>.accounts` estiverem configuradas sem `channels.<channel>.defaultAccount` ou `accounts.default`, o doctor avisa que o roteamento de fallback pode escolher uma conta inesperada.
    - Se `channels.<channel>.defaultAccount` estiver definido para um ID de conta desconhecido, o doctor avisa e lista os IDs de conta configurados.

  </Accordion>
  <Accordion title="2b. Substituições de provedor OpenCode">
    Se você adicionou manualmente `models.providers.opencode`, `opencode-zen` ou `opencode-go`, isso substitui o catálogo OpenCode integrado de `@mariozechner/pi-ai`. Isso pode forçar modelos para a API errada ou zerar custos. O doctor avisa para que você possa remover a substituição e restaurar o roteamento de API + custos por modelo.
  </Accordion>
  <Accordion title="2c. Migração do browser e prontidão do Chrome MCP">
    Se a configuração do seu browser ainda aponta para o caminho removido da extensão do Chrome, o doctor a normaliza para o modelo atual de conexão local ao host do Chrome MCP:

    - `browser.profiles.*.driver: "extension"` se torna `"existing-session"`
    - `browser.relayBindHost` é removido

    O doctor também audita o caminho local ao host do Chrome MCP quando você usa `defaultProfile: "user"` ou um perfil `existing-session` configurado:

    - verifica se o Google Chrome está instalado no mesmo host para perfis padrão de conexão automática
    - verifica a versão detectada do Chrome e avisa quando ela é inferior ao Chrome 144
    - lembra você de ativar a depuração remota na página de inspeção do navegador (por exemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    O doctor não pode ativar essa configuração no lado do Chrome por você. O Chrome MCP local ao host ainda exige:

    - um navegador baseado em Chromium 144+ no host do gateway/node
    - o navegador em execução localmente
    - depuração remota ativada nesse navegador
    - aprovação do primeiro prompt de consentimento de conexão no navegador

    A prontidão aqui se refere apenas aos pré-requisitos de conexão local. `existing-session` mantém os limites atuais de rota do Chrome MCP; rotas avançadas como `responsebody`, exportação de PDF, interceptação de download e ações em lote ainda exigem um navegador gerenciado ou um perfil CDP bruto.

    Esta verificação **não** se aplica a Docker, sandbox, remote-browser ou outros fluxos headless. Eles continuam usando CDP bruto.

  </Accordion>
  <Accordion title="2d. Pré-requisitos de TLS do OAuth">
    Quando um perfil OAuth do OpenAI Codex está configurado, o doctor sonda o endpoint de autorização da OpenAI para verificar se a pilha TLS local de Node/OpenSSL consegue validar a cadeia de certificados. Se a sonda falhar com um erro de certificado (por exemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado expirado ou certificado autoassinado), o doctor imprime orientações de correção específicas da plataforma. No macOS com um Node do Homebrew, a correção geralmente é `brew postinstall ca-certificates`. Com `--deep`, a sonda é executada mesmo que o gateway esteja íntegro.
  </Accordion>
  <Accordion title="2e. Substituições de provedor OAuth do Codex">
    Se você adicionou anteriormente configurações legadas de transporte da OpenAI em `models.providers.openai-codex`, elas podem sobrepor o caminho integrado do provedor OAuth do Codex que as versões mais novas usam automaticamente. O doctor avisa quando vê essas configurações antigas de transporte junto com OAuth do Codex para que você possa remover ou reescrever a substituição obsoleta de transporte e recuperar o comportamento integrado de roteamento/fallback. Proxies personalizados e substituições apenas de cabeçalho continuam compatíveis e não acionam esse aviso.
  </Accordion>
  <Accordion title="2f. Avisos de rota do plugin Codex">
    Quando o plugin Codex incluído está ativado, o doctor também verifica se referências de modelo primário `openai-codex/*` ainda são resolvidas pelo runner padrão do PI. Essa combinação é válida quando você quer autenticação OAuth/assinatura do Codex via PI, mas é fácil confundi-la com o harness nativo app-server do Codex. O doctor avisa e aponta para o formato explícito do app-server: `openai/*` mais `agentRuntime.id: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex`.

    O doctor não repara isso automaticamente porque ambas as rotas são válidas:

    - `openai-codex/*` + PI significa "usar autenticação OAuth/assinatura do Codex pelo runner normal do OpenClaw."
    - `openai/*` + `runtime: "codex"` significa "executar o turno incorporado pelo app-server nativo do Codex."
    - `/codex ...` significa "controlar ou vincular uma conversa nativa do Codex a partir do chat."
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
      - para `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de conta padrão: `default`)

    Essas migrações são best-effort e idempotentes; o doctor emitirá avisos quando deixar para trás quaisquer pastas legadas como backups. O Gateway/CLI também migra automaticamente as sessões legadas + o diretório do agente na inicialização, para que histórico/auth/modelos caiam no caminho por agente sem precisar executar o doctor manualmente. A autenticação do WhatsApp é intencionalmente migrada apenas via `openclaw doctor`. A normalização do provedor/mapa de provedores de Talk agora compara por igualdade estrutural, então diferenças apenas na ordem das chaves não acionam mais alterações repetidas e sem efeito de `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migrações legadas de manifesto de plugin">
    O doctor examina todos os manifestos de plugin instalados em busca de chaves de capacidade obsoletas no nível superior (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando encontradas, ele oferece movê-las para o objeto `contracts` e reescrever o arquivo de manifesto no local. Essa migração é idempotente; se a chave `contracts` já tiver os mesmos valores, a chave legada será removida sem duplicar os dados.
  </Accordion>
  <Accordion title="3b. Migrações legadas do armazenamento Cron">
    O doctor também verifica o armazenamento de jobs Cron (`~/.openclaw/cron/jobs.json` por padrão, ou `cron.store` quando substituído) em busca de formatos antigos de job que o agendador ainda aceita por compatibilidade.

    As limpezas atuais de Cron incluem:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de payload de nível superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nível superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliases de entrega `provider` do payload → `delivery.channel` explícito
    - jobs legados simples de fallback de Webhook com `notify: true` → `delivery.mode="webhook"` explícito com `delivery.to=cron.webhook`

    O doctor só migra automaticamente jobs `notify: true` quando pode fazê-lo sem alterar o comportamento. Se um job combinar fallback legado de notificação com um modo de entrega não webhook já existente, o doctor avisa e deixa esse job para revisão manual.

  </Accordion>
  <Accordion title="3c. Limpeza de locks de sessão">
    O doctor examina cada diretório de sessão do agente em busca de arquivos de lock de gravação obsoletos — arquivos deixados para trás quando uma sessão foi encerrada de forma anormal. Para cada arquivo de lock encontrado, ele informa: o caminho, PID, se o PID ainda está ativo, idade do lock e se ele é considerado obsoleto (PID morto ou mais de 30 minutos). Nos modos `--fix` / `--repair`, ele remove automaticamente arquivos de lock obsoletos; caso contrário, imprime uma observação e instrui você a executar novamente com `--fix`.
  </Accordion>
  <Accordion title="3d. Reparo de ramificações da transcrição da sessão">
    O doctor examina arquivos JSONL de sessão do agente em busca do formato de ramificação duplicada criado pelo bug de reescrita da transcrição do prompt em 2026.4.24: um turno de usuário abandonado com contexto interno de runtime do OpenClaw mais um irmão ativo contendo o mesmo prompt de usuário visível. Nos modos `--fix` / `--repair`, o doctor cria um backup de cada arquivo afetado ao lado do original e reescreve a transcrição para a ramificação ativa, para que o histórico do gateway e os leitores de memória não vejam mais turnos duplicados.
  </Accordion>
  <Accordion title="4. Verificações de integridade do estado (persistência de sessão, roteamento e segurança)">
    O diretório de estado é o tronco cerebral operacional. Se ele desaparecer, você perde sessões, credenciais, logs e configuração (a menos que tenha backups em outro lugar).

    O doctor verifica:

    - **Diretório de estado ausente**: avisa sobre perda catastrófica de estado, solicita recriar o diretório e lembra que não pode recuperar dados ausentes.
    - **Permissões do diretório de estado**: verifica gravabilidade; oferece corrigir permissões (e emite uma dica de `chown` quando detecta incompatibilidade de proprietário/grupo).
    - **Diretório de estado do macOS sincronizado por nuvem**: avisa quando o estado é resolvido em iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...` porque caminhos com suporte de sincronização podem causar E/S mais lenta e corridas de lock/sincronização.
    - **Diretório de estado em SD ou eMMC no Linux**: avisa quando o estado é resolvido para uma origem de montagem `mmcblk*`, porque E/S aleatória com suporte em SD ou eMMC pode ser mais lenta e desgastar mais rapidamente sob gravações de sessão e credenciais.
    - **Diretórios de sessão ausentes**: `sessions/` e o diretório de armazenamento de sessões são necessários para persistir histórico e evitar falhas `ENOENT`.
    - **Incompatibilidade de transcrição**: avisa quando entradas recentes de sessão têm arquivos de transcrição ausentes.
    - **Sessão principal com "JSONL de 1 linha"**: sinaliza quando a transcrição principal tem apenas uma linha (o histórico não está se acumulando).
    - **Múltiplos diretórios de estado**: avisa quando existem várias pastas `~/.openclaw` em diretórios home ou quando `OPENCLAW_STATE_DIR` aponta para outro lugar (o histórico pode se dividir entre instalações).
    - **Lembrete de modo remoto**: se `gateway.mode=remote`, o doctor lembra você de executá-lo no host remoto (o estado fica lá).
    - **Permissões do arquivo de configuração**: avisa se `~/.openclaw/openclaw.json` puder ser lido por grupo/mundo e oferece restringir para `600`.

  </Accordion>
  <Accordion title="5. Integridade da autenticação do modelo (expiração do OAuth)">
    O doctor inspeciona perfis OAuth no armazenamento de auth, avisa quando tokens estão expirando/expirados e pode atualizá-los quando for seguro. Se o perfil OAuth/token da Anthropic estiver obsoleto, ele sugere uma chave de API da Anthropic ou o caminho de setup-token da Anthropic. Prompts de atualização aparecem apenas ao executar no modo interativo (TTY); `--non-interactive` ignora tentativas de atualização.

    Quando uma atualização de OAuth falha permanentemente (por exemplo `refresh_token_reused`, `invalid_grant` ou um provedor dizendo para fazer login novamente), o doctor informa que é necessária nova autenticação e imprime o comando exato `openclaw models auth login --provider ...` a ser executado.

    O doctor também informa perfis de autenticação que estão temporariamente inutilizáveis devido a:

    - cooldowns curtos (limites de taxa/timeouts/falhas de auth)
    - desativações mais longas (falhas de faturamento/crédito)

  </Accordion>
  <Accordion title="6. Validação do modelo de hooks">
    Se `hooks.gmail.model` estiver definido, o doctor valida a referência do modelo em relação ao catálogo e à lista de permissões e avisa quando ela não será resolvida ou não for permitida.
  </Accordion>
  <Accordion title="7. Reparo da imagem de sandbox">
    Quando o sandboxing está ativado, o doctor verifica imagens Docker e oferece compilá-las ou trocar para nomes legados se a imagem atual estiver ausente.
  </Accordion>
  <Accordion title="7b. Dependências de runtime de plugin incluído">
    O doctor verifica dependências de runtime apenas para plugins incluídos que estão ativos na configuração atual ou ativados pelo padrão do manifesto incluído, por exemplo `plugins.entries.discord.enabled: true`, legado `channels.discord.enabled: true` ou um provedor incluído ativado por padrão. Se faltar alguma dependência, o doctor informa os pacotes e os instala no modo `openclaw doctor --fix` / `openclaw doctor --repair`. Plugins externos ainda usam `openclaw plugins install` / `openclaw plugins update`; o doctor não instala dependências para caminhos arbitrários de plugin.

    O Gateway e a CLI local também podem reparar dependências de runtime de plugins incluídos ativos sob demanda antes de importar um plugin incluído. Essas instalações são delimitadas ao diretório raiz de instalação do runtime do plugin, são executadas com scripts desativados, não gravam lock de pacote e são protegidas por um lock no diretório raiz de instalação para que inicializações concorrentes da CLI ou do Gateway não alterem a mesma árvore `node_modules` ao mesmo tempo.

  </Accordion>
  <Accordion title="8. Migrações de serviço do Gateway e dicas de limpeza">
    O doctor detecta serviços legados do gateway (launchd/systemd/schtasks) e oferece removê-los e instalar o serviço do OpenClaw usando a porta atual do gateway. Ele também pode examinar serviços extras semelhantes a gateway e imprimir dicas de limpeza. Serviços de gateway do OpenClaw nomeados por perfil são considerados de primeira classe e não são marcados como "extras".
  </Accordion>
  <Accordion title="8b. Migração Matrix na inicialização">
    Quando uma conta de canal Matrix tem uma migração de estado legado pendente ou acionável, o doctor (no modo `--fix` / `--repair`) cria um snapshot pré-migração e depois executa etapas de migração best-effort: migração de estado legado do Matrix e preparação legada de estado criptografado. Ambas as etapas não são fatais; erros são registrados e a inicialização continua. No modo somente leitura (`openclaw doctor` sem `--fix`) esta verificação é totalmente ignorada.
  </Accordion>
  <Accordion title="8c. Pareamento de dispositivo e desvio de auth">
    O doctor agora inspeciona o estado de pareamento de dispositivo como parte da verificação normal de integridade.

    O que ele informa:

    - solicitações pendentes de primeiro pareamento
    - upgrades pendentes de função para dispositivos já pareados
    - upgrades pendentes de escopo para dispositivos já pareados
    - reparos de incompatibilidade de chave pública quando o ID do dispositivo ainda corresponde, mas a identidade do dispositivo não corresponde mais ao registro aprovado
    - registros pareados sem um token ativo para uma função aprovada
    - tokens pareados cujos escopos divergem da linha de base de pareamento aprovada
    - entradas locais em cache de token de dispositivo para a máquina atual que antecedem uma rotação de token no lado do gateway ou carregam metadados de escopo obsoletos

    O doctor não aprova automaticamente solicitações de pareamento nem faz rotação automática de tokens de dispositivo. Em vez disso, ele imprime as próximas etapas exatas:

    - inspecione solicitações pendentes com `openclaw devices list`
    - aprove a solicitação exata com `openclaw devices approve <requestId>`
    - faça a rotação de um token novo com `openclaw devices rotate --device <deviceId> --role <role>`
    - remova e reaprove um registro obsoleto com `openclaw devices remove <deviceId>`

    Isso fecha a lacuna comum de "já pareado, mas ainda recebendo pairing required": agora o doctor distingue primeiro pareamento de upgrades pendentes de função/escopo e de desvio obsoleto de token/identidade do dispositivo.

  </Accordion>
  <Accordion title="9. Avisos de segurança">
    O doctor emite avisos quando um provedor está aberto a DMs sem uma lista de permissões ou quando uma política está configurada de maneira perigosa.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Se estiver em execução como serviço de usuário do systemd, o doctor garante que o lingering esteja ativado para que o gateway continue ativo após logout.
  </Accordion>
  <Accordion title="11. Status do workspace (Skills, plugins e diretórios legados)">
    O doctor imprime um resumo do estado do workspace para o agente padrão:

    - **Status de Skills**: conta Skills elegíveis, com requisitos ausentes e bloqueadas por lista de permissões.
    - **Diretórios legados do workspace**: avisa quando `~/openclaw` ou outros diretórios legados do workspace existem ao lado do workspace atual.
    - **Status de plugin**: conta plugins ativados/desativados/com erro; lista IDs de plugin para quaisquer erros; informa capacidades de plugins incluídos.
    - **Avisos de compatibilidade de plugin**: sinaliza plugins que têm problemas de compatibilidade com o runtime atual.
    - **Diagnósticos de plugin**: expõe quaisquer avisos ou erros em tempo de carregamento emitidos pelo registro de plugins.

  </Accordion>
  <Accordion title="11b. Tamanho do arquivo de bootstrap">
    O doctor verifica se arquivos de bootstrap do workspace (por exemplo `AGENTS.md`, `CLAUDE.md` ou outros arquivos de contexto injetados) estão próximos ou acima do orçamento configurado de caracteres. Ele informa por arquivo as contagens de caracteres bruto vs. injetado, porcentagem de truncamento, causa do truncamento (`max/file` ou `max/total`) e total de caracteres injetados como fração do orçamento total. Quando os arquivos estão truncados ou próximos do limite, o doctor imprime dicas para ajustar `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11c. Shell completion">
    O doctor verifica se o tab completion está instalado para o shell atual (zsh, bash, fish ou PowerShell):

    - Se o perfil do shell usar um padrão lento de completion dinâmica (`source <(openclaw completion ...)`), o doctor o atualiza para a variante mais rápida baseada em arquivo em cache.
    - Se o completion estiver configurado no perfil, mas o arquivo de cache estiver ausente, o doctor regenera o cache automaticamente.
    - Se nenhum completion estiver configurado, o doctor solicita instalar (somente no modo interativo; ignorado com `--non-interactive`).

    Execute `openclaw completion --write-state` para regenerar manualmente o cache.

  </Accordion>
  <Accordion title="12. Verificações de auth do Gateway (token local)">
    O doctor verifica a prontidão da autenticação por token do gateway local.

    - Se o modo token precisar de um token e nenhuma fonte de token existir, o doctor oferece gerar um.
    - Se `gateway.auth.token` for gerenciado por SecretRef, mas indisponível, o doctor avisa e não o sobrescreve com texto simples.
    - `openclaw doctor --generate-gateway-token` força a geração somente quando nenhum token SecretRef estiver configurado.

  </Accordion>
  <Accordion title="12b. Reparos somente leitura conscientes de SecretRef">
    Alguns fluxos de reparo precisam inspecionar credenciais configuradas sem enfraquecer o comportamento fail-fast do runtime.

    - `openclaw doctor --fix` agora usa o mesmo modelo resumido e somente leitura de SecretRef que os comandos da família status para reparos direcionados de configuração.
    - Exemplo: o reparo de `allowFrom` / `groupAllowFrom` com `@username` do Telegram tenta usar credenciais configuradas do bot quando disponíveis.
    - Se o token do bot do Telegram estiver configurado via SecretRef, mas indisponível no caminho atual do comando, o doctor informa que a credencial está configurada, porém indisponível, e ignora a resolução automática em vez de falhar ou relatar incorretamente que o token está ausente.

  </Accordion>
  <Accordion title="13. Verificação de integridade do Gateway + reinicialização">
    O doctor executa uma verificação de integridade e oferece reiniciar o gateway quando ele parece não estar íntegro.
  </Accordion>
  <Accordion title="13b. Prontidão da busca em memória">
    O doctor verifica se o provedor configurado de embeddings para busca em memória está pronto para o agente padrão. O comportamento depende do backend e do provedor configurados:

    - **Backend QMD**: verifica se o binário `qmd` está disponível e pode ser iniciado. Caso contrário, imprime orientações de correção, incluindo o pacote npm e uma opção de caminho manual para o binário.
    - **Provedor local explícito**: verifica se existe um arquivo de modelo local ou uma URL de modelo remoto/baixável reconhecida. Se estiver ausente, sugere mudar para um provedor remoto.
    - **Provedor remoto explícito** (`openai`, `voyage` etc.): verifica se uma chave de API está presente no ambiente ou no armazenamento de auth. Imprime dicas de correção acionáveis se estiver ausente.
    - **Provedor automático**: verifica primeiro a disponibilidade do modelo local e depois tenta cada provedor remoto na ordem de seleção automática.

    Quando um resultado de sonda do gateway está disponível (o gateway estava íntegro no momento da verificação), o doctor cruza esse resultado com a configuração visível para a CLI e observa qualquer discrepância.

    Use `openclaw memory status --deep` para verificar a prontidão dos embeddings em tempo de execução.

  </Accordion>
  <Accordion title="14. Avisos de status de canal">
    Se o gateway estiver íntegro, o doctor executa uma sonda de status de canal e informa avisos com correções sugeridas.
  </Accordion>
  <Accordion title="15. Auditoria + reparo da configuração do supervisor">
    O doctor verifica a configuração instalada do supervisor (launchd/systemd/schtasks) em busca de padrões ausentes ou desatualizados (por exemplo, dependências `network-online` do systemd e atraso de reinicialização). Quando encontra uma incompatibilidade, recomenda uma atualização e pode reescrever o arquivo de serviço/tarefa com os padrões atuais.

    Observações:

    - `openclaw doctor` solicita confirmação antes de reescrever a configuração do supervisor.
    - `openclaw doctor --yes` aceita os prompts de reparo padrão.
    - `openclaw doctor --repair` aplica correções recomendadas sem solicitações.
    - `openclaw doctor --repair --force` sobrescreve configurações personalizadas do supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantém o doctor em modo somente leitura para o ciclo de vida do serviço do gateway. Ele ainda informa a integridade do serviço e executa reparos não relacionados a serviço, mas ignora instalação/inicialização/reinicialização/bootstrap de serviço, regravações de configuração do supervisor e limpeza de serviços legados porque um supervisor externo é dono desse ciclo de vida.
    - Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação/reparo de serviço pelo doctor valida o SecretRef, mas não persiste valores resolvidos de token em texto simples nos metadados de ambiente do serviço do supervisor.
    - Se a autenticação por token exigir um token e o token SecretRef configurado não estiver resolvido, o doctor bloqueia o caminho de instalação/reparo com orientações acionáveis.
    - Se `gateway.auth.token` e `gateway.auth.password` estiverem ambos configurados e `gateway.auth.mode` não estiver definido, o doctor bloqueia instalação/reparo até que o modo seja definido explicitamente.
    - Para unidades user-systemd no Linux, as verificações de desvio de token do doctor agora incluem fontes `Environment=` e `EnvironmentFile=` ao comparar metadados de autenticação do serviço.
    - Reparos de serviço do doctor se recusam a reescrever, parar ou reiniciar um serviço de gateway de um binário OpenClaw mais antigo quando a configuração foi gravada pela última vez por uma versão mais nova. Consulte [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Você sempre pode forçar uma regravação completa via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnósticos de runtime + porta do Gateway">
    O doctor inspeciona o runtime do serviço (PID, último status de saída) e avisa quando o serviço está instalado, mas não está realmente em execução. Ele também verifica colisões de porta na porta do gateway (padrão `18789`) e informa causas prováveis (gateway já em execução, túnel SSH).
  </Accordion>
  <Accordion title="17. Melhores práticas de runtime do Gateway">
    O doctor avisa quando o serviço do gateway está em execução em Bun ou em um caminho Node gerenciado por gerenciador de versão (`nvm`, `fnm`, `volta`, `asdf` etc.). Canais WhatsApp + Telegram exigem Node, e caminhos de gerenciador de versão podem quebrar após upgrades porque o serviço não carrega a inicialização do seu shell. O doctor oferece migrar para uma instalação de Node do sistema quando disponível (Homebrew/apt/choco).
  </Accordion>
  <Accordion title="18. Gravação da configuração + metadados do assistente">
    O doctor persiste quaisquer alterações de configuração e grava metadados do assistente para registrar a execução do doctor.
  </Accordion>
  <Accordion title="19. Dicas de workspace (backup + sistema de memória)">
    O doctor sugere um sistema de memória do workspace quando ele está ausente e imprime uma dica de backup se o workspace ainda não estiver sob git.

    Consulte [/concepts/agent-workspace](/pt-BR/concepts/agent-workspace) para um guia completo sobre a estrutura do workspace e backup com git (recomendado GitHub ou GitLab privado).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Runbook do Gateway](/pt-BR/gateway)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
