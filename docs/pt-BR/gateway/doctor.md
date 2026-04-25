---
read_when:
    - Adicionando ou modificando migrações do Doctor
    - Introduzindo mudanças incompatíveis de configuração
summary: 'Comando Doctor: verificações de integridade, migrações de configuração e etapas de reparo'
title: Doctor
x-i18n:
    generated_at: "2026-04-25T13:46:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05063983a5ffd9dc117a8135f76519941c28d30778d6ecbaa3f276a5fd4fce46
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` é a ferramenta de reparo + migração do OpenClaw. Ela corrige
configuração/estado desatualizados, verifica a integridade e fornece etapas de reparo acionáveis.

## Início rápido

```bash
openclaw doctor
```

### Headless / automação

```bash
openclaw doctor --yes
```

Aceita os padrões sem perguntar (incluindo etapas de reparo de reinício/serviço/sandbox quando aplicável).

```bash
openclaw doctor --repair
```

Aplica os reparos recomendados sem perguntar (reparos + reinicializações quando for seguro).

```bash
openclaw doctor --repair --force
```

Aplica também reparos agressivos (sobrescreve configurações personalizadas de supervisor).

```bash
openclaw doctor --non-interactive
```

Executa sem prompts e aplica apenas migrações seguras (normalização de configuração + movimentações de estado em disco). Ignora ações de reinício/serviço/sandbox que exigem confirmação humana.
Migrações de estado legado são executadas automaticamente quando detectadas.

```bash
openclaw doctor --deep
```

Examina serviços do sistema em busca de instalações extras do gateway (launchd/systemd/schtasks).

Se você quiser revisar as alterações antes de gravar, abra primeiro o arquivo de configuração:

```bash
cat ~/.openclaw/openclaw.json
```

## O que ele faz (resumo)

- Atualização opcional antes da execução para instalações git (somente interativo).
- Verificação de atualização do protocolo da UI (recompila a Control UI quando o schema do protocolo é mais novo).
- Verificação de integridade + prompt para reinício.
- Resumo de status de Skills (elegível/ausente/bloqueado) e status de plugins.
- Normalização de configuração para valores legados.
- Migração da configuração de Talk de campos legados planos `talk.*` para `talk.provider` + `talk.providers.<provider>`.
- Verificações de migração do navegador para configurações legadas da extensão do Chrome e prontidão do Chrome MCP.
- Avisos de substituição de provedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Avisos de sombreamento de OAuth do Codex (`models.providers.openai-codex`).
- Verificação de pré-requisitos TLS de OAuth para perfis OpenAI Codex OAuth.
- Migração de estado legado em disco (sessões/dir do agente/autenticação do WhatsApp).
- Migração de chaves de contrato de manifesto de plugin legado (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migração de store Cron legado (`jobId`, `schedule.cron`, campos de entrega/payload no nível superior, payload `provider`, jobs simples de fallback de Webhook `notify: true`).
- Inspeção de arquivo de bloqueio de sessão e limpeza de bloqueios obsoletos.
- Verificações de integridade e permissões de estado (sessões, transcrições, diretório de estado).
- Verificações de permissões do arquivo de configuração (`chmod 600`) ao executar localmente.
- Integridade da autenticação do modelo: verifica expiração de OAuth, pode renovar tokens prestes a expirar e relata estados de cooldown/desativação de perfil de autenticação.
- Detecção de diretório extra de workspace (`~/openclaw`).
- Reparo de imagem sandbox quando o sandbox está ativado.
- Migração de serviço legado e detecção de gateway extra.
- Migração de estado legado do canal Matrix (em modo `--fix` / `--repair`).
- Verificações de runtime do gateway (serviço instalado mas não em execução; label launchd em cache).
- Avisos de status do canal (sondados a partir do gateway em execução).
- Auditoria de configuração do supervisor (launchd/systemd/schtasks) com reparo opcional.
- Verificações de boas práticas de runtime do gateway (Node vs Bun, caminhos de gerenciador de versão).
- Diagnóstico de colisão de porta do gateway (padrão `18789`).
- Avisos de segurança para políticas abertas de DM.
- Verificações de autenticação do gateway para modo de token local (oferece geração de token quando não existe fonte de token; não sobrescreve configurações de token SecretRef).
- Detecção de problemas de pareamento de dispositivos (primeiras solicitações de pareamento pendentes, upgrades pendentes de função/escopo, divergência obsoleta do cache local de token de dispositivo e divergência de autenticação do registro pareado).
- Verificação de linger do systemd no Linux.
- Verificação do tamanho do arquivo de bootstrap do workspace (avisos de truncamento/próximo do limite para arquivos de contexto).
- Verificação de status de shell completion e instalação/upgrade automáticos.
- Verificação de prontidão do provedor de embedding para pesquisa em memória (modelo local, chave de API remota ou binário QMD).
- Verificações de instalação a partir do código-fonte (incompatibilidade do workspace pnpm, assets de UI ausentes, binário tsx ausente).
- Grava configuração atualizada + metadados do wizard.

## Backfill e reset da UI Dreams

A cena Dreams da Control UI inclui ações **Backfill**, **Reset** e **Clear Grounded**
para o workflow de dreaming grounded. Essas ações usam métodos RPC
no estilo Doctor do gateway, mas **não** fazem parte do reparo/migração da CLI `openclaw doctor`.

O que elas fazem:

- **Backfill** examina arquivos históricos `memory/YYYY-MM-DD.md` no
  workspace ativo, executa a passagem do diário REM grounded e grava entradas
  reversíveis de backfill em `DREAMS.md`.
- **Reset** remove apenas essas entradas de diário de backfill marcadas de `DREAMS.md`.
- **Clear Grounded** remove apenas entradas staged grounded-only de curto prazo que
  vieram de replay histórico e ainda não acumularam recall ao vivo ou suporte
  diário.

O que elas **não** fazem por si só:

- não editam `MEMORY.md`
- não executam migrações completas do doctor
- não fazem automaticamente o stage de candidatos grounded no store de promoção
  de curto prazo ao vivo, a menos que você execute primeiro explicitamente o caminho de CLI staged

Se você quiser que o replay histórico grounded influencie a lane normal de promoção
profunda, use o fluxo da CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Isso faz stage de candidatos duráveis grounded no store de dreaming de curto prazo, mantendo
`DREAMS.md` como a superfície de revisão.

## Comportamento detalhado e justificativa

### 0) Atualização opcional (instalações git)

Se isto for um checkout git e o doctor estiver sendo executado interativamente, ele oferece
atualizar (fetch/rebase/build) antes de executar o doctor.

### 1) Normalização de configuração

Se a configuração contiver formatos legados de valor (por exemplo `messages.ackReaction`
sem uma substituição específica por canal), o doctor os normaliza para o schema
atual.

Isso inclui campos legados planos de Talk. A configuração pública atual de Talk é
`talk.provider` + `talk.providers.<provider>`. O doctor reescreve formatos antigos
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` para o mapa do provedor.

### 2) Migrações de chaves de configuração legada

Quando a configuração contém chaves obsoletas, outros comandos se recusam a executar e pedem
que você execute `openclaw doctor`.

O doctor irá:

- Explicar quais chaves legadas foram encontradas.
- Mostrar a migração aplicada.
- Reescrever `~/.openclaw/openclaw.json` com o schema atualizado.

O Gateway também executa automaticamente migrações do doctor na inicialização quando detecta um
formato legado de configuração, para que configurações desatualizadas sejam reparadas sem intervenção manual.
Migrações do store de jobs Cron são tratadas por `openclaw doctor --fix`.

Migrações atuais:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
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
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Para canais com `accounts` nomeadas, mas ainda com valores de canal no nível superior de conta única, mova esses valores com escopo de conta para a conta promovida escolhida para esse canal (`accounts.default` para a maioria dos canais; Matrix pode preservar um alvo nomeado/padrão correspondente já existente)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- remover `browser.relayBindHost` (configuração legada de relay de extensão)

Os avisos do doctor também incluem orientações sobre conta padrão para canais com múltiplas contas:

- Se duas ou mais entradas `channels.<channel>.accounts` estiverem configuradas sem `channels.<channel>.defaultAccount` ou `accounts.default`, o doctor avisa que o roteamento de fallback pode escolher uma conta inesperada.
- Se `channels.<channel>.defaultAccount` estiver definido para um ID de conta desconhecido, o doctor avisa e lista os IDs de conta configurados.

### 2b) Substituições de provedor OpenCode

Se você adicionou `models.providers.opencode`, `opencode-zen` ou `opencode-go`
manualmente, isso substitui o catálogo OpenCode integrado de `@mariozechner/pi-ai`.
Isso pode forçar modelos para a API errada ou zerar custos. O doctor avisa para que você
possa remover a substituição e restaurar o roteamento por API por modelo + custos.

### 2c) Migração de navegador e prontidão do Chrome MCP

Se a configuração do seu navegador ainda aponta para o caminho removido da extensão do Chrome, o doctor
a normaliza para o modelo atual de conexão host-local do Chrome MCP:

- `browser.profiles.*.driver: "extension"` torna-se `"existing-session"`
- `browser.relayBindHost` é removido

O doctor também audita o caminho host-local do Chrome MCP quando você usa `defaultProfile:
"user"` ou um perfil `existing-session` configurado:

- verifica se o Google Chrome está instalado no mesmo host para perfis padrão
  com conexão automática
- verifica a versão detectada do Chrome e avisa quando ela é inferior ao Chrome 144
- lembra você de ativar a depuração remota na página de inspeção do navegador (por
  exemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`
  ou `edge://inspect/#remote-debugging`)

O doctor não pode ativar a configuração do lado do Chrome para você. O Chrome MCP host-local
ainda exige:

- um navegador baseado em Chromium 144+ no host do gateway/Node
- o navegador em execução localmente
- depuração remota ativada nesse navegador
- aprovação do primeiro prompt de consentimento de conexão no navegador

A prontidão aqui diz respeito apenas aos pré-requisitos de conexão local. Existing-session mantém
os limites atuais de rota do Chrome MCP; rotas avançadas como `responsebody`, exportação
de PDF, interceptação de download e ações em lote ainda exigem um navegador
gerenciado ou perfil raw CDP.

Essa verificação **não** se aplica a fluxos Docker, sandbox, navegador remoto ou outros
fluxos headless. Esses continuam usando raw CDP.

### 2d) Pré-requisitos TLS de OAuth

Quando um perfil OpenAI Codex OAuth está configurado, o doctor testa o endpoint de
autorização da OpenAI para verificar se a pilha TLS local de Node/OpenSSL consegue
validar a cadeia de certificados. Se o teste falhar com um erro de certificado (por
exemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado expirado ou certificado autoassinado),
o doctor imprime orientações de correção específicas por plataforma. No macOS com Node do Homebrew, a
correção normalmente é `brew postinstall ca-certificates`. Com `--deep`, o teste é executado
mesmo que o gateway esteja saudável.

### 2c) Substituições de provedor Codex OAuth

Se você adicionou anteriormente configurações legadas de transporte OpenAI em
`models.providers.openai-codex`, elas podem sombrear o caminho integrado do
provedor Codex OAuth que versões mais novas usam automaticamente. O doctor avisa quando vê
essas configurações antigas de transporte junto com Codex OAuth para que você possa remover ou reescrever
a substituição antiga de transporte e recuperar o comportamento integrado de roteamento/fallback.
Proxies personalizados e substituições apenas de cabeçalho continuam compatíveis e não
disparam esse aviso.

### 3) Migrações de estado legado (layout em disco)

O doctor pode migrar layouts antigos em disco para a estrutura atual:

- Store de sessões + transcrições:
  - de `~/.openclaw/sessions/` para `~/.openclaw/agents/<agentId>/sessions/`
- Dir do agente:
  - de `~/.openclaw/agent/` para `~/.openclaw/agents/<agentId>/agent/`
- Estado de autenticação do WhatsApp (Baileys):
  - de `~/.openclaw/credentials/*.json` legado (exceto `oauth.json`)
  - para `~/.openclaw/credentials/whatsapp/<accountId>/...` (id de conta padrão: `default`)

Essas migrações são de melhor esforço e idempotentes; o doctor emitirá avisos quando
deixar pastas legadas como backup. O Gateway/CLI também migra automaticamente
as sessões legadas + dir do agente na inicialização para que histórico/autenticação/modelos caiam no
caminho por agente sem execução manual do doctor. A autenticação do WhatsApp é intencionalmente migrada
somente via `openclaw doctor`. A normalização de Talk provider/provider-map agora
compara por igualdade estrutural, então diferenças apenas na ordem das chaves não disparam mais
mudanças repetidas e sem efeito de `doctor --fix`.

### 3a) Migrações de manifesto de plugin legado

O doctor examina todos os manifestos de plugin instalados em busca de chaves
obsoletas de capability no nível superior (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Quando encontradas, ele oferece movê-las para o objeto `contracts`
e reescrever o arquivo de manifesto no local. Essa migração é idempotente;
se a chave `contracts` já tiver os mesmos valores, a chave legada será removida
sem duplicar os dados.

### 3b) Migrações de store Cron legado

O doctor também verifica o store de jobs Cron (`~/.openclaw/cron/jobs.json` por padrão,
ou `cron.store` quando substituído) em busca de formatos antigos de job que o agendador ainda
aceita por compatibilidade.

As limpezas atuais do Cron incluem:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- campos de payload no nível superior (`message`, `model`, `thinking`, ...) → `payload`
- campos de entrega no nível superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- aliases de entrega do `provider` no payload → `delivery.channel` explícito
- jobs legados simples de fallback de Webhook `notify: true` → `delivery.mode="webhook"` explícito com `delivery.to=cron.webhook`

O doctor só migra automaticamente jobs `notify: true` quando consegue fazer isso sem
mudar o comportamento. Se um job combinar fallback legado de notificação com um modo
de entrega não-Webhook já existente, o doctor avisa e deixa esse job para revisão manual.

### 3c) Limpeza de bloqueio de sessão

O doctor examina cada diretório de sessão de agente em busca de arquivos obsoletos de bloqueio de gravação — arquivos deixados
para trás quando uma sessão encerrou de forma anormal. Para cada arquivo de bloqueio encontrado, ele relata:
o caminho, PID, se o PID ainda está ativo, idade do bloqueio e se ele é
considerado obsoleto (PID morto ou mais antigo que 30 minutos). Em modo `--fix` / `--repair`,
ele remove automaticamente arquivos obsoletos de bloqueio; caso contrário, imprime uma observação e
instrui você a executar novamente com `--fix`.

### 4) Verificações de integridade de estado (persistência de sessão, roteamento e segurança)

O diretório de estado é o tronco cerebral operacional. Se ele desaparecer, você perde
sessões, credenciais, logs e configuração (a menos que tenha backups em outro lugar).

O doctor verifica:

- **Diretório de estado ausente**: avisa sobre perda catastrófica de estado, solicita recriar
  o diretório e lembra que ele não pode recuperar dados ausentes.
- **Permissões do diretório de estado**: verifica gravabilidade; oferece reparo de permissões
  (e emite uma dica de `chown` quando é detectada incompatibilidade de owner/group).
- **Diretório de estado sincronizado por nuvem no macOS**: avisa quando o estado é resolvido sob iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou
  `~/Library/CloudStorage/...` porque caminhos com sincronização podem causar I/O mais lento
  e condições de corrida de lock/sincronização.
- **Diretório de estado em SD ou eMMC no Linux**: avisa quando o estado é resolvido para uma origem
  de montagem `mmcblk*`, porque I/O aleatório em SD ou eMMC pode ser mais lento e desgastar
  mais rapidamente sob gravações de sessão e credenciais.
- **Diretórios de sessão ausentes**: `sessions/` e o diretório do store de sessão são
  necessários para persistir histórico e evitar falhas `ENOENT`.
- **Incompatibilidade de transcrição**: avisa quando entradas recentes de sessão têm
  arquivos de transcrição ausentes.
- **Sessão principal “JSONL de 1 linha”**: sinaliza quando a transcrição principal tem apenas uma
  linha (o histórico não está se acumulando).
- **Múltiplos diretórios de estado**: avisa quando existem várias pastas `~/.openclaw` em
  diretórios home ou quando `OPENCLAW_STATE_DIR` aponta para outro lugar (o histórico pode
  ser dividido entre instalações).
- **Lembrete de modo remoto**: se `gateway.mode=remote`, o doctor lembra você de executá-lo
  no host remoto (o estado vive lá).
- **Permissões do arquivo de configuração**: avisa se `~/.openclaw/openclaw.json` for
  legível por grupo/mundo e oferece restringir para `600`.

### 5) Integridade da autenticação do modelo (expiração de OAuth)

O doctor inspeciona perfis OAuth no store de autenticação, avisa quando tokens estão
expirando/expirados e pode renová-los quando for seguro. Se o perfil de
OAuth/token da Anthropic estiver obsoleto, ele sugere uma chave de API da Anthropic ou o
caminho de setup-token da Anthropic.
Prompts de renovação só aparecem ao executar interativamente (TTY); `--non-interactive`
ignora tentativas de renovação.

Quando uma renovação de OAuth falha permanentemente (por exemplo `refresh_token_reused`,
`invalid_grant` ou um provedor dizendo que você precisa entrar novamente), o doctor informa
que é necessária nova autenticação e imprime o comando exato `openclaw models auth login --provider ...`
a ser executado.

O doctor também relata perfis de autenticação temporariamente indisponíveis devido a:

- cooldowns curtos (limites de taxa/timeouts/falhas de autenticação)
- desativações mais longas (falhas de cobrança/crédito)

### 6) Validação de modelo de hooks

Se `hooks.gmail.model` estiver definido, o doctor valida a referência do modelo em relação ao
catálogo e à lista de permissões e avisa quando ela não puder ser resolvida ou estiver bloqueada.

### 7) Reparo de imagem sandbox

Quando o sandbox está ativado, o doctor verifica imagens Docker e oferece fazer build ou
trocar para nomes legados se a imagem atual estiver ausente.

### 7b) Dependências de runtime de plugins incluídos

O doctor verifica dependências de runtime apenas para plugins incluídos que estejam ativos na
configuração atual ou ativados pelo padrão de manifesto incluído, por exemplo
`plugins.entries.discord.enabled: true`, legado
`channels.discord.enabled: true` ou um provedor incluído ativado por padrão. Se alguma
estiver ausente, o doctor informa os pacotes e os instala em
modo `openclaw doctor --fix` / `openclaw doctor --repair`. Plugins externos continuam
usando `openclaw plugins install` / `openclaw plugins update`; o doctor não
instala dependências para caminhos arbitrários de plugin.

O Gateway e a CLI local também podem reparar sob demanda dependências de runtime de plugins incluídos
ativos antes de importar um plugin incluído. Essas instalações são
limitadas à raiz de instalação de runtime do plugin, são executadas com scripts desativados, não
gravam um lock de pacote e são protegidas por um bloqueio na raiz de instalação para que inicializações
concorrentes da CLI ou do Gateway não modifiquem a mesma árvore `node_modules` ao mesmo tempo.

### 8) Migrações de serviço do gateway e dicas de limpeza

O doctor detecta serviços legados do gateway (launchd/systemd/schtasks) e
oferece removê-los e instalar o serviço OpenClaw usando a porta atual do gateway.
Ele também pode examinar serviços extras semelhantes a gateway e imprimir dicas de limpeza.
Serviços OpenClaw gateway nomeados por perfil são considerados de primeira classe e não
são sinalizados como “extras”.

### 8b) Migração de Matrix na inicialização

Quando uma conta de canal Matrix tem uma migração de estado legado pendente ou acionável,
o doctor (em modo `--fix` / `--repair`) cria um snapshot pré-migração e então
executa as etapas de migração de melhor esforço: migração de estado legado do Matrix e preparação
legada de estado criptografado. Ambas as etapas não são fatais; erros são registrados e a
inicialização continua. Em modo somente leitura (`openclaw doctor` sem `--fix`) essa verificação
é totalmente ignorada.

### 8c) Pareamento de dispositivos e divergência de autenticação

O doctor agora inspeciona o estado de pareamento de dispositivos como parte da verificação normal de integridade.

O que ele relata:

- solicitações pendentes de primeiro pareamento
- upgrades pendentes de função para dispositivos já pareados
- upgrades pendentes de escopo para dispositivos já pareados
- reparos de incompatibilidade de chave pública quando o id do dispositivo ainda corresponde, mas a
  identidade do dispositivo não corresponde mais ao registro aprovado
- registros pareados sem token ativo para uma função aprovada
- tokens pareados cujos escopos divergem da linha de base de pareamento aprovada
- entradas locais em cache de token de dispositivo para a máquina atual que antecedem uma
  rotação de token no lado do gateway ou carregam metadados de escopo obsoletos

O doctor não aprova automaticamente solicitações de pareamento nem rotaciona automaticamente tokens de dispositivo. Ele
imprime as próximas etapas exatas:

- inspecione solicitações pendentes com `openclaw devices list`
- aprove a solicitação exata com `openclaw devices approve <requestId>`
- rotacione um token novo com `openclaw devices rotate --device <deviceId> --role <role>`
- remova e aprove novamente um registro obsoleto com `openclaw devices remove <deviceId>`

Isso fecha a lacuna comum de “já pareado, mas ainda recebendo pairing required”:
agora o doctor distingue primeiro pareamento de upgrades pendentes de função/escopo
e de divergência obsoleta de token/identidade do dispositivo.

### 9) Avisos de segurança

O doctor emite avisos quando um provedor está aberto a DMs sem lista de permissões, ou
quando uma política está configurada de forma perigosa.

### 10) systemd linger (Linux)

Se estiver em execução como serviço de usuário systemd, o doctor garante que lingering esteja ativado para que o
gateway permaneça ativo após logout.

### 11) Status do workspace (Skills, plugins e diretórios legados)

O doctor imprime um resumo do estado do workspace para o agente padrão:

- **Status de Skills**: conta Skills elegíveis, com requisitos ausentes e bloqueadas por lista de permissões.
- **Diretórios legados do workspace**: avisa quando `~/openclaw` ou outros diretórios legados de workspace
  existem junto com o workspace atual.
- **Status de plugin**: conta plugins carregados/desativados/com erro; lista IDs de plugin para quaisquer
  erros; relata capabilities de plugins incluídos.
- **Avisos de compatibilidade de plugin**: sinaliza plugins que têm problemas de compatibilidade com
  o runtime atual.
- **Diagnósticos de plugin**: mostra quaisquer avisos ou erros em tempo de carregamento emitidos pelo
  registro de plugins.

### 11b) Tamanho do arquivo de bootstrap

O doctor verifica se arquivos bootstrap do workspace (por exemplo `AGENTS.md`,
`CLAUDE.md` ou outros arquivos de contexto injetados) estão próximos ou acima do
orçamento configurado de caracteres. Ele informa contagens de caracteres por arquivo, brutas vs. injetadas,
percentual de truncamento, causa do truncamento (`max/file` ou `max/total`) e total de
caracteres injetados como fração do orçamento total. Quando arquivos são truncados ou estão próximos
do limite, o doctor imprime dicas para ajustar `agents.defaults.bootstrapMaxChars`
e `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Shell completion

O doctor verifica se o preenchimento por tab está instalado para o shell atual
(zsh, bash, fish ou PowerShell):

- Se o perfil do shell usa um padrão lento de completion dinâmico
  (`source <(openclaw completion ...)`), o doctor o atualiza para a variante
  mais rápida com arquivo em cache.
- Se o completion estiver configurado no perfil, mas o arquivo de cache estiver ausente,
  o doctor regenera o cache automaticamente.
- Se nenhum completion estiver configurado, o doctor solicita instalação
  (somente modo interativo; ignorado com `--non-interactive`).

Execute `openclaw completion --write-state` para regenerar o cache manualmente.

### 12) Verificações de autenticação do gateway (token local)

O doctor verifica a prontidão da autenticação por token do gateway local.

- Se o modo token precisar de um token e não houver nenhuma fonte de token, o doctor oferece gerar um.
- Se `gateway.auth.token` for gerenciado por SecretRef, mas estiver indisponível, o doctor avisa e não o sobrescreve com texto simples.
- `openclaw doctor --generate-gateway-token` força a geração apenas quando nenhum SecretRef de token estiver configurado.

### 12b) Reparos somente leitura com reconhecimento de SecretRef

Alguns fluxos de reparo precisam inspecionar credenciais configuradas sem enfraquecer o comportamento fail-fast em runtime.

- `openclaw doctor --fix` agora usa o mesmo modelo de resumo SecretRef somente leitura dos comandos da família status para reparos direcionados de configuração.
- Exemplo: o reparo de `@username` de Telegram em `allowFrom` / `groupAllowFrom` tenta usar credenciais configuradas do bot quando disponíveis.
- Se o token do bot do Telegram estiver configurado via SecretRef, mas indisponível no caminho de comando atual, o doctor informa que a credencial está configurada, porém indisponível, e ignora a resolução automática em vez de falhar ou relatar incorretamente que o token está ausente.

### 13) Verificação de integridade do gateway + reinício

O doctor executa uma verificação de integridade e oferece reiniciar o gateway quando ele parece
não saudável.

### 13b) Prontidão da pesquisa em memória

O doctor verifica se o provedor de embedding configurado para pesquisa em memória está pronto
para o agente padrão. O comportamento depende do backend e do provedor configurados:

- **Backend QMD**: testa se o binário `qmd` está disponível e pode ser iniciado.
  Caso contrário, imprime orientações de correção, incluindo o pacote npm e uma opção manual de caminho para binário.
- **Provedor local explícito**: verifica um arquivo de modelo local ou uma URL de modelo remota/baixável reconhecida. Se estiver ausente, sugere mudar para um provedor remoto.
- **Provedor remoto explícito** (`openai`, `voyage` etc.): verifica se existe uma chave de API
  no ambiente ou no store de autenticação. Imprime dicas acionáveis de correção se estiver ausente.
- **Provedor automático**: verifica primeiro a disponibilidade do modelo local e depois tenta cada
  provedor remoto na ordem de seleção automática.

Quando o resultado de uma sondagem do gateway está disponível (o gateway estava saudável no momento da
verificação), o doctor cruza esse resultado com a configuração visível pela CLI e informa
qualquer divergência.

Use `openclaw memory status --deep` para verificar a prontidão de embedding em runtime.

### 14) Avisos de status de canal

Se o gateway estiver saudável, o doctor executa uma sondagem de status de canal e relata
avisos com correções sugeridas.

### 15) Auditoria + reparo da configuração do supervisor

O doctor verifica a configuração instalada do supervisor (launchd/systemd/schtasks) em busca de
padrões ausentes ou desatualizados (por exemplo, dependências `network-online` do systemd e
atraso de reinício). Quando encontra incompatibilidade, ele recomenda uma atualização e pode
reescrever o arquivo de serviço/tarefa para os padrões atuais.

Notas:

- `openclaw doctor` solicita confirmação antes de reescrever a configuração do supervisor.
- `openclaw doctor --yes` aceita os prompts de reparo padrão.
- `openclaw doctor --repair` aplica as correções recomendadas sem prompts.
- `openclaw doctor --repair --force` sobrescreve configurações personalizadas do supervisor.
- Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação/reparo do serviço pelo doctor valida o SecretRef, mas não persiste valores resolvidos de token em texto simples nos metadados de ambiente do serviço do supervisor.
- Se a autenticação por token exigir um token e o SecretRef de token configurado não estiver resolvido, o doctor bloqueia o caminho de instalação/reparo com orientações acionáveis.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, o doctor bloqueia a instalação/reparo até que o modo seja definido explicitamente.
- Para unidades Linux user-systemd, as verificações de divergência de token do doctor agora incluem tanto fontes `Environment=` quanto `EnvironmentFile=` ao comparar metadados de autenticação do serviço.
- Você sempre pode forçar uma regravação completa com `openclaw gateway install --force`.

### 16) Diagnósticos de runtime + porta do gateway

O doctor inspeciona o runtime do serviço (PID, último status de saída) e avisa quando o
serviço está instalado, mas não está realmente em execução. Ele também verifica colisões de porta
na porta do gateway (padrão `18789`) e relata causas prováveis (gateway já
em execução, túnel SSH).

### 17) Boas práticas de runtime do gateway

O doctor avisa quando o serviço do gateway é executado em Bun ou em um caminho Node gerenciado por versão
(`nvm`, `fnm`, `volta`, `asdf` etc.). Canais WhatsApp + Telegram exigem Node,
e caminhos de gerenciador de versão podem quebrar após upgrades porque o serviço não
carrega a inicialização do seu shell. O doctor oferece migrar para uma instalação Node do sistema quando
disponível (Homebrew/apt/choco).

### 18) Gravação de configuração + metadados do wizard

O doctor persiste quaisquer mudanças de configuração e marca metadados do wizard para registrar a
execução do doctor.

### 19) Dicas de workspace (backup + sistema de memória)

O doctor sugere um sistema de memória do workspace quando ele está ausente e imprime uma dica de backup
se o workspace ainda não estiver sob git.

Consulte [/concepts/agent-workspace](/pt-BR/concepts/agent-workspace) para um guia completo sobre
estrutura do workspace e backup com git (GitHub ou GitLab privado recomendado).

## Relacionado

- [Solução de problemas do gateway](/pt-BR/gateway/troubleshooting)
- [Runbook do gateway](/pt-BR/gateway)
