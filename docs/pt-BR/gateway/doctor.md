---
read_when:
    - Adicionando ou modificando migrações do doctor
    - Introduzindo alterações incompatíveis na configuração
summary: 'Comando doctor: verificações de integridade, migrações de configuração e etapas de reparo'
title: Doctor
x-i18n:
    generated_at: "2026-04-25T18:18:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13204a57facd19459fc812a8daa0fe629b6725bdabb014f59f871fa64c22e71d
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

Aceita os padrões sem perguntar (incluindo etapas de reparo de reinicialização/serviço/sandbox, quando aplicável).

```bash
openclaw doctor --repair
```

Aplica os reparos recomendados sem perguntar (reparos + reinicializações quando for seguro).

```bash
openclaw doctor --repair --force
```

Aplica também reparos agressivos (sobrescreve configurações personalizadas do supervisor).

```bash
openclaw doctor --non-interactive
```

Executa sem prompts e aplica apenas migrações seguras (normalização de configuração + movimentações de estado em disco). Ignora ações de reinicialização/serviço/sandbox que exigem confirmação humana.
Migrações de estado legado são executadas automaticamente quando detectadas.

```bash
openclaw doctor --deep
```

Verifica serviços do sistema em busca de instalações extras do Gateway (launchd/systemd/schtasks).

Se você quiser revisar as alterações antes de gravar, abra primeiro o arquivo de configuração:

```bash
cat ~/.openclaw/openclaw.json
```

## O que ele faz (resumo)

- Atualização prévia opcional para instalações via git (apenas no modo interativo).
- Verificação de atualização do protocolo da UI (recompila a Control UI quando o schema do protocolo é mais novo).
- Verificação de integridade + prompt de reinicialização.
- Resumo do status de Skills (elegíveis/ausentes/bloqueadas) e status de plugins.
- Normalização de configuração para valores legados.
- Migração da configuração de Talk dos campos legados planos `talk.*` para `talk.provider` + `talk.providers.<provider>`.
- Verificações de migração do navegador para configurações legadas da extensão do Chrome e prontidão do Chrome MCP.
- Avisos de substituição de provedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Avisos de sombreamento de OAuth do Codex (`models.providers.openai-codex`).
- Verificação de pré-requisitos de TLS do OAuth para perfis OAuth do OpenAI Codex.
- Migração de estado legado em disco (sessões/diretório do agente/autenticação do WhatsApp).
- Migração de chave de contrato de manifesto de Plugin legado (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migração do armazenamento Cron legado (`jobId`, `schedule.cron`, campos de entrega/payload no nível superior, `provider` do payload, jobs simples de fallback de Webhook com `notify: true`).
- Inspeção de arquivo de lock de sessão e limpeza de locks obsoletos.
- Verificações de integridade e permissões de estado (sessões, transcrições, diretório de estado).
- Verificações de permissão do arquivo de configuração (`chmod 600`) ao executar localmente.
- Integridade de autenticação de modelo: verifica expiração do OAuth, pode atualizar tokens prestes a expirar e informa estados de período de espera/desativação de perfil de autenticação.
- Detecção de diretório extra de workspace (`~/openclaw`).
- Reparo da imagem de sandbox quando o sandbox está habilitado.
- Migração de serviço legado e detecção de Gateway extra.
- Migração de estado legado do canal Matrix (nos modos `--fix` / `--repair`).
- Verificações de runtime do Gateway (serviço instalado mas não em execução; rótulo launchd em cache).
- Avisos de status de canal (sondados a partir do Gateway em execução).
- Auditoria de configuração do supervisor (launchd/systemd/schtasks) com reparo opcional.
- Verificações de boas práticas de runtime do Gateway (Node vs Bun, caminhos de gerenciadores de versão).
- Diagnóstico de colisão de porta do Gateway (padrão `18789`).
- Avisos de segurança para políticas abertas de DM.
- Verificações de autenticação do Gateway para modo de token local (oferece geração de token quando não existe fonte de token; não sobrescreve configurações de token `SecretRef`).
- Detecção de problemas de pareamento de dispositivo (solicitações pendentes de primeiro pareamento, upgrades pendentes de função/escopo, divergência obsoleta de cache local de token de dispositivo e divergência de autenticação de registro pareado).
- Verificação de linger do systemd no Linux.
- Verificação do tamanho de arquivos de bootstrap do workspace (avisos de truncamento/próximo do limite para arquivos de contexto).
- Verificação do status de complementos de shell e instalação/atualização automática.
- Verificação de prontidão do provedor de embeddings de busca de memória (modelo local, chave de API remota ou binário QMD).
- Verificações de instalação a partir do código-fonte (incompatibilidade de workspace do pnpm, assets de UI ausentes, binário tsx ausente).
- Grava configuração atualizada + metadados do assistente.

## Backfill e reset da UI de Dreams

A cena Dreams da Control UI inclui ações de **Backfill**, **Reset** e **Clear Grounded**
para o fluxo de grounded dreaming. Essas ações usam métodos RPC
no estilo doctor do gateway, mas **não** fazem parte do reparo/migração da CLI `openclaw doctor`.

O que elas fazem:

- **Backfill** analisa arquivos históricos `memory/YYYY-MM-DD.md` no
  workspace ativo, executa a passagem de diário REM fundamentada e grava entradas
  reversíveis de backfill em `DREAMS.md`.
- **Reset** remove de `DREAMS.md` apenas essas entradas de diário de backfill marcadas.
- **Clear Grounded** remove apenas entradas temporárias preparadas e exclusivamente fundamentadas que
  vieram da reprodução histórica e ainda não acumularam recuperação ao vivo nem
  suporte diário.

O que elas **não** fazem sozinhas:

- não editam `MEMORY.md`
- não executam migrações completas do doctor
- não colocam automaticamente candidatos fundamentados na área temporária de promoção ao vivo,
  a menos que você execute explicitamente primeiro o fluxo de CLI preparado

Se você quiser que a reprodução histórica fundamentada influencie o fluxo normal de promoção profunda,
use o fluxo da CLI em vez disso:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Isso coloca candidatos duráveis fundamentados na área temporária de dreaming, enquanto
mantém `DREAMS.md` como superfície de revisão.

## Comportamento detalhado e justificativa

### 0) Atualização opcional (instalações via git)

Se isto for um checkout git e o doctor estiver sendo executado interativamente, ele oferece
atualizar (fetch/rebase/build) antes de executar o doctor.

### 1) Normalização de configuração

Se a configuração contiver formatos legados de valor (por exemplo `messages.ackReaction`
sem uma substituição específica por canal), o doctor os normaliza para o schema atual.

Isso inclui campos planos legados de Talk. A configuração pública atual de Talk é
`talk.provider` + `talk.providers.<provider>`. O doctor reescreve formatos antigos
de `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` no mapa do provedor.

### 2) Migrações de chaves de configuração legadas

Quando a configuração contém chaves obsoletas, outros comandos se recusam a executar e pedem
que você rode `openclaw doctor`.

O doctor irá:

- Explicar quais chaves legadas foram encontradas.
- Mostrar a migração que foi aplicada.
- Reescrever `~/.openclaw/openclaw.json` com o schema atualizado.

O Gateway também executa automaticamente migrações do doctor na inicialização quando detecta um
formato de configuração legado, então configurações desatualizadas são reparadas sem intervenção manual.
Migrações do armazenamento de jobs Cron são tratadas por `openclaw doctor --fix`.

Migrações atuais:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` no nível superior
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
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Para canais com `accounts` nomeadas mas com valores de canal no nível superior ainda remanescentes de conta única, mover esses valores delimitados por conta para a conta promovida escolhida para esse canal (`accounts.default` para a maioria dos canais; o Matrix pode preservar um destino nomeado/padrão correspondente já existente)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- remover `browser.relayBindHost` (configuração legada de relay da extensão)

Os avisos do doctor também incluem orientação de conta padrão para canais com várias contas:

- Se duas ou mais entradas `channels.<channel>.accounts` estiverem configuradas sem `channels.<channel>.defaultAccount` ou `accounts.default`, o doctor avisa que o roteamento de fallback pode escolher uma conta inesperada.
- Se `channels.<channel>.defaultAccount` estiver definido para um ID de conta desconhecido, o doctor avisa e lista os IDs de conta configurados.

### 2b) Substituições de provedor OpenCode

Se você adicionou manualmente `models.providers.opencode`, `opencode-zen` ou `opencode-go`,
isso substitui o catálogo interno do OpenCode vindo de `@mariozechner/pi-ai`.
Isso pode forçar modelos para a API errada ou zerar custos. O doctor avisa para que você
possa remover a substituição e restaurar o roteamento por API por modelo + custos.

### 2c) Migração do navegador e prontidão do Chrome MCP

Se a configuração do seu navegador ainda apontar para o caminho removido da extensão do Chrome, o doctor
a normaliza para o modelo atual de conexão do Chrome MCP local ao host:

- `browser.profiles.*.driver: "extension"` passa a ser `"existing-session"`
- `browser.relayBindHost` é removido

O doctor também audita o caminho local ao host do Chrome MCP quando você usa `defaultProfile:
"user"` ou um perfil `existing-session` configurado:

- verifica se o Google Chrome está instalado no mesmo host para perfis de conexão automática padrão
- verifica a versão detectada do Chrome e avisa quando ela é inferior ao Chrome 144
- lembra você de habilitar depuração remota na página de inspeção do navegador (por
  exemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`
  ou `edge://inspect/#remote-debugging`)

O doctor não pode habilitar a configuração do lado do Chrome para você. O Chrome MCP local ao host
ainda exige:

- um navegador baseado em Chromium 144+ no host do gateway/node
- o navegador em execução localmente
- depuração remota habilitada nesse navegador
- aprovar o primeiro prompt de consentimento de conexão no navegador

A prontidão aqui é apenas sobre pré-requisitos locais de conexão. `existing-session` mantém
os limites atuais de rota do Chrome MCP; rotas avançadas como `responsebody`, exportação em PDF,
interceptação de downloads e ações em lote ainda exigem um navegador gerenciado
ou um perfil CDP bruto.

Esta verificação **não** se aplica a Docker, sandbox, remote-browser ou outros
fluxos headless. Eles continuam usando CDP bruto.

### 2d) Pré-requisitos de TLS do OAuth

Quando um perfil OAuth do OpenAI Codex está configurado, o doctor sonda o endpoint
de autorização da OpenAI para verificar se a stack TLS local do Node/OpenSSL consegue
validar a cadeia de certificados. Se a sonda falhar com um erro de certificado (por
exemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado expirado ou certificado autoassinado),
o doctor imprime orientações de correção específicas da plataforma. No macOS com um Node do Homebrew, a
correção geralmente é `brew postinstall ca-certificates`. Com `--deep`, a sonda é executada
mesmo que o Gateway esteja íntegro.

### 2c) Substituições de provedor do Codex OAuth

Se você adicionou anteriormente configurações legadas de transporte da OpenAI em
`models.providers.openai-codex`, elas podem sombrear o caminho interno do
provedor Codex OAuth que versões mais recentes usam automaticamente. O doctor avisa quando encontra
essas configurações antigas de transporte junto com Codex OAuth, para que você possa remover ou reescrever
a substituição de transporte desatualizada e recuperar o comportamento interno de roteamento/fallback.
Proxies personalizados e substituições apenas de cabeçalho continuam compatíveis e não
disparam esse aviso.

### 3) Migrações de estado legado (layout em disco)

O doctor pode migrar layouts antigos em disco para a estrutura atual:

- Armazenamento de sessões + transcrições:
  - de `~/.openclaw/sessions/` para `~/.openclaw/agents/<agentId>/sessions/`
- Diretório do agente:
  - de `~/.openclaw/agent/` para `~/.openclaw/agents/<agentId>/agent/`
- Estado de autenticação do WhatsApp (Baileys):
  - de `~/.openclaw/credentials/*.json` legados (exceto `oauth.json`)
  - para `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de conta padrão: `default`)

Essas migrações são best-effort e idempotentes; o doctor emitirá avisos quando
deixar pastas legadas para trás como backups. O Gateway/CLI também migra automaticamente
as sessões legadas + diretório do agente na inicialização, para que histórico/autenticação/modelos caiam no
caminho por agente sem necessidade de executar o doctor manualmente. A autenticação do WhatsApp é
intencionalmente migrada apenas via `openclaw doctor`. A normalização de provider/provider-map do Talk agora
compara por igualdade estrutural, então diferenças apenas na ordem das chaves não disparam mais
alterações repetidas e sem efeito em `doctor --fix`.

### 3a) Migrações legadas de manifesto de Plugin

O doctor examina todos os manifestos de plugins instalados em busca de chaves obsoletas
de capacidade no nível superior (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Quando encontradas, ele oferece mover essas chaves para o objeto `contracts`
e reescrever o arquivo do manifesto no lugar. Essa migração é idempotente;
se a chave `contracts` já tiver os mesmos valores, a chave legada será removida
sem duplicar os dados.

### 3b) Migrações legadas do armazenamento Cron

O doctor também verifica o armazenamento de jobs Cron (`~/.openclaw/cron/jobs.json` por padrão,
ou `cron.store` quando substituído) em busca de formatos antigos de job que o scheduler ainda
aceita por compatibilidade.

As limpezas atuais do Cron incluem:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- campos de payload no nível superior (`message`, `model`, `thinking`, ...) → `payload`
- campos de entrega no nível superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- aliases de entrega `provider` do payload → `delivery.channel` explícito
- jobs legados simples de fallback de Webhook com `notify: true` → `delivery.mode="webhook"` explícito com `delivery.to=cron.webhook`

O doctor só migra automaticamente jobs `notify: true` quando consegue fazê-lo sem
alterar o comportamento. Se um job combinar fallback legado de notificação com um
modo de entrega não webhook já existente, o doctor avisa e deixa esse job para revisão manual.

### 3c) Limpeza de locks de sessão

O doctor analisa o diretório de sessões de cada agente em busca de arquivos obsoletos de lock de gravação — arquivos deixados
para trás quando uma sessão foi encerrada de forma anormal. Para cada arquivo de lock encontrado, ele informa:
o caminho, PID, se o PID ainda está ativo, idade do lock e se ele é
considerado obsoleto (PID morto ou mais de 30 minutos). Nos modos `--fix` / `--repair`,
ele remove automaticamente arquivos de lock obsoletos; caso contrário, imprime uma observação e
instrui você a executar novamente com `--fix`.

### 4) Verificações de integridade do estado (persistência de sessão, roteamento e segurança)

O diretório de estado é o tronco cerebral operacional. Se ele desaparecer, você perde
sessões, credenciais, logs e configuração (a menos que tenha backups em outro lugar).

O doctor verifica:

- **Diretório de estado ausente**: avisa sobre perda catastrófica de estado, oferece recriar
  o diretório e lembra que não pode recuperar dados ausentes.
- **Permissões do diretório de estado**: verifica se ele é gravável; oferece reparar permissões
  (e emite uma dica de `chown` quando detecta incompatibilidade de owner/group).
- **Diretório de estado do macOS sincronizado em nuvem**: avisa quando o estado resolve para iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou
  `~/Library/CloudStorage/...` porque caminhos apoiados por sincronização podem causar I/O mais lento
  e condições de corrida de lock/sincronização.
- **Diretório de estado Linux em SD ou eMMC**: avisa quando o estado resolve para uma origem de montagem `mmcblk*`,
  porque I/O aleatório em SD ou eMMC pode ser mais lento e desgastar
  mais rápido com gravações de sessão e credenciais.
- **Diretórios de sessão ausentes**: `sessions/` e o diretório de armazenamento de sessões são
  necessários para persistir histórico e evitar falhas `ENOENT`.
- **Incompatibilidade de transcrição**: avisa quando entradas recentes de sessão têm arquivos
  de transcrição ausentes.
- **Sessão principal “JSONL de 1 linha”**: sinaliza quando a transcrição principal tem apenas uma
  linha (o histórico não está se acumulando).
- **Vários diretórios de estado**: avisa quando existem várias pastas `~/.openclaw` em
  diretórios home ou quando `OPENCLAW_STATE_DIR` aponta para outro lugar (o histórico pode
  se dividir entre instalações).
- **Lembrete de modo remoto**: se `gateway.mode=remote`, o doctor lembra você de executá-lo
  no host remoto (o estado vive lá).
- **Permissões do arquivo de configuração**: avisa se `~/.openclaw/openclaw.json` estiver
  legível por grupo/mundo e oferece restringir para `600`.

### 5) Integridade da autenticação de modelo (expiração de OAuth)

O doctor inspeciona perfis OAuth no armazenamento de autenticação, avisa quando os tokens estão
perto de expirar/já expiraram e pode atualizá-los quando for seguro. Se o perfil
OAuth/token do Anthropic estiver desatualizado, ele sugere uma chave de API do Anthropic ou o
caminho de setup-token do Anthropic.
Prompts de atualização aparecem apenas em modo interativo (TTY); `--non-interactive`
ignora tentativas de atualização.

Quando uma atualização de OAuth falha permanentemente (por exemplo `refresh_token_reused`,
`invalid_grant` ou um provedor dizendo para você entrar novamente), o doctor informa
que é necessário reautenticar e imprime o comando exato `openclaw models auth login --provider ...`
a ser executado.

O doctor também informa perfis de autenticação temporariamente inutilizáveis devido a:

- períodos de espera curtos (limites de taxa/timeouts/falhas de autenticação)
- desativações mais longas (falhas de cobrança/crédito)

### 6) Validação do modelo de hooks

Se `hooks.gmail.model` estiver definido, o doctor valida a referência de modelo em relação ao
catálogo e à allowlist e avisa quando ela não puder ser resolvida ou não for permitida.

### 7) Reparo da imagem de sandbox

Quando o sandbox está habilitado, o doctor verifica imagens Docker e oferece construir ou
mudar para nomes legados se a imagem atual estiver ausente.

### 7b) Dependências de runtime de plugins empacotados

O doctor verifica dependências de runtime apenas para plugins empacotados que estejam ativos na
configuração atual ou habilitados pelo padrão do manifesto empacotado, por exemplo
`plugins.entries.discord.enabled: true`, legado
`channels.discord.enabled: true` ou um provedor empacotado habilitado por padrão. Se alguma
estiver ausente, o doctor informa os pacotes e os instala no
modo `openclaw doctor --fix` / `openclaw doctor --repair`. Plugins externos ainda
usam `openclaw plugins install` / `openclaw plugins update`; o doctor não
instala dependências para caminhos arbitrários de plugins.

O Gateway e a CLI local também podem reparar sob demanda dependências de runtime de plugins empacotados ativos
antes de importar um plugin empacotado. Essas instalações são
delimitadas à raiz de instalação de runtime do plugin, executadas com scripts desativados, não
gravam um lock de pacote e são protegidas por um lock da raiz de instalação, para que inicializações
concorrentes da CLI ou Gateway não mutem a mesma árvore `node_modules` ao mesmo tempo.

### 8) Migrações de serviço do Gateway e dicas de limpeza

O doctor detecta serviços legados do gateway (launchd/systemd/schtasks) e
oferece removê-los e instalar o serviço OpenClaw usando a porta atual do gateway.
Ele também pode examinar serviços extras semelhantes ao gateway e imprimir dicas de limpeza.
Serviços de gateway do OpenClaw com nome de perfil são tratados como de primeira classe e não
são sinalizados como “extras”.

### 8b) Migração Matrix na inicialização

Quando uma conta de canal Matrix tem uma migração de estado legado pendente ou acionável,
o doctor (no modo `--fix` / `--repair`) cria um snapshot pré-migração e então
executa etapas de migração best-effort: migração de estado Matrix legado e preparação de estado
criptografado legado. Ambas as etapas não são fatais; erros são registrados em log e a
inicialização continua. No modo somente leitura (`openclaw doctor` sem `--fix`) essa verificação
é totalmente ignorada.

### 8c) Pareamento de dispositivo e divergência de autenticação

O doctor agora inspeciona o estado de pareamento de dispositivos como parte da verificação normal de integridade.

O que ele informa:

- solicitações pendentes de primeiro pareamento
- upgrades pendentes de função para dispositivos já pareados
- upgrades pendentes de escopo para dispositivos já pareados
- reparos de incompatibilidade de chave pública em que o ID do dispositivo ainda corresponde, mas a
  identidade do dispositivo não corresponde mais ao registro aprovado
- registros pareados sem um token ativo para uma função aprovada
- tokens pareados cujos escopos divergem da linha de base de pareamento aprovada
- entradas locais em cache de token de dispositivo para a máquina atual que são anteriores a uma
  rotação de token no lado do gateway ou carregam metadados de escopo desatualizados

O doctor não aprova automaticamente solicitações de pareamento nem rotaciona automaticamente tokens de dispositivo. Ele
imprime exatamente as próximas etapas:

- inspecionar solicitações pendentes com `openclaw devices list`
- aprovar a solicitação exata com `openclaw devices approve <requestId>`
- rotacionar um token novo com `openclaw devices rotate --device <deviceId> --role <role>`
- remover e aprovar novamente um registro desatualizado com `openclaw devices remove <deviceId>`

Isso fecha a lacuna comum de “já está pareado, mas ainda exige pareamento”:
o doctor agora distingue primeiro pareamento de upgrades pendentes de função/escopo
e de divergência desatualizada de token/identidade do dispositivo.

### 9) Avisos de segurança

O doctor emite avisos quando um provedor está aberto a DMs sem uma allowlist, ou
quando uma política está configurada de forma perigosa.

### 10) Linger do systemd (Linux)

Se estiver rodando como um serviço de usuário do systemd, o doctor garante que o lingering esteja habilitado para que o
gateway permaneça ativo após logout.

### 11) Status do workspace (skills, plugins e diretórios legados)

O doctor imprime um resumo do estado do workspace para o agente padrão:

- **Status de Skills**: conta Skills elegíveis, com requisitos ausentes e bloqueadas por allowlist.
- **Diretórios legados de workspace**: avisa quando `~/openclaw` ou outros diretórios legados de workspace
  existem junto com o workspace atual.
- **Status de plugins**: conta plugins habilitados/desabilitados/com erro; lista IDs de plugins para quaisquer
  erros; informa capacidades de plugins do bundle.
- **Avisos de compatibilidade de plugins**: sinaliza plugins que têm problemas de compatibilidade com
  o runtime atual.
- **Diagnósticos de plugins**: expõe quaisquer avisos ou erros em tempo de carregamento emitidos pelo
  registro de plugins.

### 11b) Tamanho do arquivo de bootstrap

O doctor verifica se arquivos de bootstrap do workspace (por exemplo `AGENTS.md`,
`CLAUDE.md` ou outros arquivos de contexto injetados) estão próximos ou acima do
orçamento configurado de caracteres. Ele informa por arquivo contagens de caracteres brutos vs. injetados, percentual
de truncamento, causa do truncamento (`max/file` ou `max/total`) e total de caracteres injetados
como fração do orçamento total. Quando arquivos são truncados ou estão próximos
do limite, o doctor imprime dicas para ajustar `agents.defaults.bootstrapMaxChars`
e `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Complemento de shell

O doctor verifica se a conclusão com tab está instalada para o shell atual
(zsh, bash, fish ou PowerShell):

- Se o perfil do shell usar um padrão lento de conclusão dinâmica
  (`source <(openclaw completion ...)`), o doctor o atualiza para a variante mais rápida
  de arquivo em cache.
- Se a conclusão estiver configurada no perfil, mas o arquivo de cache estiver ausente,
  o doctor regenera o cache automaticamente.
- Se nenhuma conclusão estiver configurada, o doctor pergunta se deve instalá-la
  (apenas no modo interativo; ignorado com `--non-interactive`).

Execute `openclaw completion --write-state` para regenerar o cache manualmente.

### 12) Verificações de autenticação do Gateway (token local)

O doctor verifica a prontidão da autenticação por token do gateway local.

- Se o modo de token precisar de um token e nenhuma fonte de token existir, o doctor oferece gerar um.
- Se `gateway.auth.token` for gerenciado por SecretRef, mas estiver indisponível, o doctor avisa e não o sobrescreve com texto simples.
- `openclaw doctor --generate-gateway-token` força a geração apenas quando nenhum token SecretRef estiver configurado.

### 12b) Reparos somente leitura com reconhecimento de SecretRef

Alguns fluxos de reparo precisam inspecionar credenciais configuradas sem enfraquecer o comportamento de falha rápida em runtime.

- `openclaw doctor --fix` agora usa o mesmo modelo resumido de SecretRef somente leitura dos comandos da família de status para reparos direcionados de configuração.
- Exemplo: o reparo `@username` de `allowFrom` / `groupAllowFrom` do Telegram tenta usar credenciais configuradas do bot quando disponíveis.
- Se o token do bot do Telegram estiver configurado via SecretRef, mas indisponível no caminho atual do comando, o doctor informa que a credencial está configurada, mas indisponível, e ignora a resolução automática em vez de falhar ou informar incorretamente que o token está ausente.

### 13) Verificação de integridade do Gateway + reinicialização

O doctor executa uma verificação de integridade e oferece reiniciar o gateway quando ele parece
não íntegro.

### 13b) Prontidão da busca de memória

O doctor verifica se o provedor configurado de embeddings para busca de memória está pronto
para o agente padrão. O comportamento depende do backend e do provedor configurados:

- **Backend QMD**: testa se o binário `qmd` está disponível e consegue ser iniciado.
  Caso contrário, imprime orientações de correção, incluindo o pacote npm e uma opção manual de caminho do binário.
- **Provedor local explícito**: verifica a presença de um arquivo de modelo local ou de uma URL de modelo remota/baixável reconhecida. Se estiver ausente, sugere mudar para um provedor remoto.
- **Provedor remoto explícito** (`openai`, `voyage` etc.): verifica se há uma chave de API
  presente no ambiente ou no armazenamento de autenticação. Imprime orientações acionáveis de correção se estiver ausente.
- **Provedor automático**: verifica primeiro a disponibilidade do modelo local e, em seguida, tenta cada provedor remoto na ordem de seleção automática.

Quando um resultado de sonda do gateway está disponível (o gateway estava íntegro no momento da
verificação), o doctor cruza esse resultado com a configuração visível pela CLI e observa
qualquer divergência.

Use `openclaw memory status --deep` para verificar a prontidão de embeddings em runtime.

### 14) Avisos de status de canal

Se o gateway estiver íntegro, o doctor executa uma sonda de status de canal e informa
avisos com correções sugeridas.

### 15) Auditoria + reparo da configuração do supervisor

O doctor verifica a configuração instalada do supervisor (launchd/systemd/schtasks) em busca de
padrões ausentes ou desatualizados (por exemplo, dependências `network-online` do systemd e
atraso de reinicialização). Quando encontra uma incompatibilidade, ele recomenda uma atualização e pode
reescrever o arquivo de serviço/tarefa para os padrões atuais.

Observações:

- `openclaw doctor` pergunta antes de reescrever a configuração do supervisor.
- `openclaw doctor --yes` aceita os prompts de reparo padrão.
- `openclaw doctor --repair` aplica as correções recomendadas sem prompts.
- `openclaw doctor --repair --force` sobrescreve configurações personalizadas do supervisor.
- Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação/reparo do serviço pelo doctor valida o SecretRef, mas não persiste valores resolvidos do token em texto simples nos metadados de ambiente do serviço supervisor.
- Se a autenticação por token exigir um token e o token SecretRef configurado não estiver resolvido, o doctor bloqueia o caminho de instalação/reparo com orientações acionáveis.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, o doctor bloqueia a instalação/reparo até que o modo seja definido explicitamente.
- Para unidades user-systemd no Linux, as verificações de divergência de token do doctor agora incluem fontes `Environment=` e `EnvironmentFile=` ao comparar metadados de autenticação do serviço.
- Você sempre pode forçar uma regravação completa com `openclaw gateway install --force`.

### 16) Runtime do Gateway + diagnósticos de porta

O doctor inspeciona o runtime do serviço (PID, último status de saída) e avisa quando o
serviço está instalado, mas na verdade não está em execução. Ele também verifica colisões de porta
na porta do gateway (padrão `18789`) e informa causas prováveis (gateway já em
execução, túnel SSH).

### 17) Boas práticas de runtime do Gateway

O doctor avisa quando o serviço do gateway roda em Bun ou em um caminho Node gerenciado por ferramenta de versão
(`nvm`, `fnm`, `volta`, `asdf` etc.). Os canais WhatsApp + Telegram exigem Node,
e caminhos de gerenciadores de versão podem quebrar após upgrades porque o serviço não
carrega a inicialização do seu shell. O doctor oferece migrar para uma instalação de Node do sistema quando
disponível (Homebrew/apt/choco).

### 18) Gravação de configuração + metadados do assistente

O doctor persiste quaisquer alterações de configuração e registra metadados do assistente para registrar a
execução do doctor.

### 19) Dicas de workspace (backup + sistema de memória)

O doctor sugere um sistema de memória do workspace quando ausente e imprime uma dica de backup
se o workspace ainda não estiver sob git.

Consulte [/concepts/agent-workspace](/pt-BR/concepts/agent-workspace) para um guia completo da
estrutura do workspace e backup com git (GitHub ou GitLab privado recomendado).

## Relacionado

- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
- [Runbook do Gateway](/pt-BR/gateway)
