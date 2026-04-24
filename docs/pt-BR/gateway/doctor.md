---
read_when:
    - Adicionando ou modificando migrações do doctor
    - Introduzindo alterações incompatíveis na configuração
summary: 'Comando doctor: verificações de integridade, migrações de configuração e etapas de reparo'
title: Doctor
x-i18n:
    generated_at: "2026-04-24T05:51:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cc0ddb91af47a246c9a37528942b7d53c166255469169d6cb0268f83359c400
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

Aceita padrões sem solicitar confirmação (incluindo etapas de reparo de reinício/serviço/sandbox quando aplicável).

```bash
openclaw doctor --repair
```

Aplica reparos recomendados sem solicitar confirmação (reparos + reinícios quando seguro).

```bash
openclaw doctor --repair --force
```

Aplica também reparos agressivos (sobrescreve configurações personalizadas do supervisor).

```bash
openclaw doctor --non-interactive
```

Executa sem prompts e aplica apenas migrações seguras (normalização de configuração + movimentações de estado em disco). Ignora ações de reinício/serviço/sandbox que exigem confirmação humana.
Migrações de estado legadas são executadas automaticamente quando detectadas.

```bash
openclaw doctor --deep
```

Examina serviços do sistema em busca de instalações extras do gateway (launchd/systemd/schtasks).

Se você quiser revisar alterações antes de gravar, abra primeiro o arquivo de configuração:

```bash
cat ~/.openclaw/openclaw.json
```

## O que ele faz (resumo)

- Atualização prévia opcional para instalações git (somente interativo).
- Verificação de atualização do protocolo da UI (reconstrói a Control UI quando o schema do protocolo é mais recente).
- Verificação de integridade + prompt para reinício.
- Resumo do status de Skills (elegíveis/ausentes/bloqueadas) e status de Plugin.
- Normalização de configuração para valores legados.
- Migração da configuração Talk de campos planos legados `talk.*` para `talk.provider` + `talk.providers.<provider>`.
- Verificações de migração do navegador para configurações legadas de extensão do Chrome e prontidão do Chrome MCP.
- Avisos de substituição do provedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Avisos de shadowing do OAuth do Codex (`models.providers.openai-codex`).
- Verificação de pré-requisitos de TLS do OAuth para perfis OAuth do OpenAI Codex.
- Migração de estado legado em disco (sessões/agent dir/autenticação do WhatsApp).
- Migração de chaves legadas de contrato de manifesto de Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migração do armazenamento Cron legado (`jobId`, `schedule.cron`, campos de entrega/payload de nível superior, payload `provider`, jobs simples de fallback de Webhook com `notify: true`).
- Inspeção de arquivo de lock de sessão e limpeza de locks obsoletos.
- Verificações de integridade e permissões do estado (sessões, transcrições, diretório de estado).
- Verificações de permissão do arquivo de configuração (chmod 600) ao executar localmente.
- Integridade da autenticação de modelos: verifica expiração de OAuth, pode atualizar tokens prestes a expirar e relata estados de cooldown/desativação de perfis de autenticação.
- Detecção de diretório extra de workspace (`~/openclaw`).
- Reparo de imagem de sandbox quando sandboxing está ativado.
- Migração de serviço legado e detecção de gateways extras.
- Migração de estado legado do canal Matrix (em modo `--fix` / `--repair`).
- Verificações do runtime do Gateway (serviço instalado, mas não em execução; rótulo launchd em cache).
- Avisos de status de canal (sondados a partir do gateway em execução).
- Auditoria de configuração do supervisor (launchd/systemd/schtasks) com reparo opcional.
- Verificações de boas práticas do runtime do Gateway (Node vs Bun, caminhos de gerenciador de versão).
- Diagnósticos de conflito de porta do Gateway (padrão `18789`).
- Avisos de segurança para políticas de DM abertas.
- Verificações de autenticação do Gateway para modo de token local (oferece geração de token quando não existe fonte de token; não sobrescreve configurações SecretRef de token).
- Detecção de problemas de pareamento de dispositivo (solicitações pendentes de primeiro pareamento, upgrades pendentes de role/scope, desvio obsoleto do cache local de token de dispositivo e desvio de autenticação de registro pareado).
- Verificação de linger do systemd no Linux.
- Verificação de tamanho de arquivo bootstrap do workspace (avisos de truncamento/próximo ao limite para arquivos de contexto).
- Verificação do status de autocomplete do shell e instalação/upgrade automáticos.
- Verificação de prontidão do provedor de embeddings para busca em memória (modelo local, chave de API remota ou binário QMD).
- Verificações de instalação de origem (incompatibilidade de workspace pnpm, ativos de UI ausentes, binário tsx ausente).
- Grava configuração atualizada + metadados do assistente.

## Backfill e reset da UI de Dreaming

A cena Dreams da Control UI inclui ações **Backfill**, **Reset** e **Clear Grounded**
para o fluxo de grounded Dreaming. Essas ações usam métodos RPC no estilo
doctor do gateway, mas **não** fazem parte do reparo/migração da CLI `openclaw doctor`.

O que elas fazem:

- **Backfill** examina arquivos históricos `memory/YYYY-MM-DD.md` no
  workspace ativo, executa a passagem grounded do diário REM e grava entradas
  reversíveis de backfill em `DREAMS.md`.
- **Reset** remove apenas essas entradas de diário de backfill marcadas de `DREAMS.md`.
- **Clear Grounded** remove apenas entradas curtas staged, somente grounded, que
  vieram de replay histórico e ainda não acumularam recall ao vivo ou suporte
  diário.

O que elas **não** fazem sozinhas:

- não editam `MEMORY.md`
- não executam migrações completas do doctor
- não fazem staging automático de candidatos grounded para o armazenamento ativo de promoção de curto prazo, a menos que você execute explicitamente primeiro o caminho CLI de staging

Se você quiser que o replay histórico grounded influencie a trilha normal de promoção profunda, use o fluxo da CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Isso faz o staging de candidatos duráveis grounded no armazenamento de Dreaming de curto prazo, enquanto
mantém `DREAMS.md` como a superfície de revisão.

## Comportamento detalhado e justificativa

### 0) Atualização opcional (instalações git)

Se isto for um checkout git e o doctor estiver sendo executado de forma interativa, ele oferece
atualizar (fetch/rebase/build) antes de executar o doctor.

### 1) Normalização da configuração

Se a configuração contiver formatos legados de valores (por exemplo `messages.ackReaction`
sem uma substituição específica de canal), o doctor os normaliza para o schema atual.

Isso inclui campos planos legados de Talk. A configuração pública atual de Talk é
`talk.provider` + `talk.providers.<provider>`. O doctor reescreve formatos antigos
de `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` para o mapa de provedores.

### 2) Migrações de chaves de configuração legadas

Quando a configuração contém chaves obsoletas, outros comandos se recusam a executar e pedem
que você execute `openclaw doctor`.

O doctor irá:

- Explicar quais chaves legadas foram encontradas.
- Mostrar a migração aplicada.
- Reescrever `~/.openclaw/openclaw.json` com o schema atualizado.

O Gateway também executa automaticamente migrações do doctor na inicialização quando detecta um
formato de configuração legado, para que configurações desatualizadas sejam reparadas sem intervenção manual.
Migrações do armazenamento de jobs Cron são tratadas por `openclaw doctor --fix`.

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
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Para canais com `accounts` nomeadas, mas com valores persistentes de canal de nível superior de conta única, mover esses valores com escopo de conta para a conta promovida escolhida para esse canal (`accounts.default` para a maioria dos canais; Matrix pode preservar um destino nomeado/padrão correspondente existente)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- remover `browser.relayBindHost` (configuração legada de relay de extensão)

Os avisos do doctor também incluem orientação sobre conta padrão para canais com múltiplas contas:

- Se duas ou mais entradas `channels.<channel>.accounts` estiverem configuradas sem `channels.<channel>.defaultAccount` ou `accounts.default`, o doctor avisa que o roteamento de fallback pode escolher uma conta inesperada.
- Se `channels.<channel>.defaultAccount` estiver definido como um ID de conta desconhecido, o doctor avisa e lista os IDs de conta configurados.

### 2b) Substituições de provedor OpenCode

Se você adicionou `models.providers.opencode`, `opencode-zen` ou `opencode-go`
manualmente, isso substitui o catálogo OpenCode embutido de `@mariozechner/pi-ai`.
Isso pode forçar modelos à API errada ou zerar custos. O doctor avisa para que você
possa remover a substituição e restaurar o roteamento por modelo da API + custos.

### 2c) Migração de navegador e prontidão do Chrome MCP

Se sua configuração de navegador ainda apontar para o caminho removido da extensão do Chrome, o doctor
a normaliza para o modelo atual de anexação local ao host do Chrome MCP:

- `browser.profiles.*.driver: "extension"` se torna `"existing-session"`
- `browser.relayBindHost` é removido

O doctor também audita o caminho local ao host do Chrome MCP quando você usa `defaultProfile:
"user"` ou um perfil `existing-session` configurado:

- verifica se o Google Chrome está instalado no mesmo host para perfis padrão
  de autoconexão
- verifica a versão detectada do Chrome e avisa quando for inferior ao Chrome 144
- lembra você de ativar depuração remota na página de inspeção do navegador (por
  exemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`
  ou `edge://inspect/#remote-debugging`)

O doctor não pode ativar a configuração do lado do Chrome para você. O Chrome MCP local ao host
ainda exige:

- um navegador baseado em Chromium 144+ no host do gateway/node
- o navegador em execução localmente
- depuração remota ativada nesse navegador
- aprovar o primeiro prompt de consentimento de anexação no navegador

A prontidão aqui diz respeito apenas a pré-requisitos de anexação local. `existing-session` mantém
os limites atuais de rota do Chrome MCP; rotas avançadas como `responsebody`, exportação de PDF,
interceptação de download e ações em lote ainda exigem um
navegador gerenciado ou perfil CDP bruto.

Essa verificação **não** se aplica a fluxos Docker, sandbox, navegador remoto ou outros
headless. Eles continuam usando CDP bruto.

### 2d) Pré-requisitos de TLS para OAuth

Quando um perfil OAuth do OpenAI Codex está configurado, o doctor sonda o endpoint de
autorização do OpenAI para verificar se a pilha TLS local do Node/OpenSSL consegue
validar a cadeia de certificados. Se a sondagem falhar com um erro de certificado (por
exemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado expirado ou autoassinado),
o doctor imprime orientações de correção específicas da plataforma. No macOS com Node do Homebrew, a
correção geralmente é `brew postinstall ca-certificates`. Com `--deep`, a sondagem é executada
mesmo que o gateway esteja íntegro.

### 2c) Substituições de provedor do OAuth do Codex

Se você adicionou anteriormente configurações legadas de transporte OpenAI em
`models.providers.openai-codex`, elas podem sombrear o caminho embutido do
provedor OAuth do Codex que versões mais novas usam automaticamente. O doctor avisa quando vê
essas configurações antigas de transporte junto com o OAuth do Codex para que você possa remover ou reescrever
a substituição obsoleta de transporte e recuperar o comportamento embutido de roteamento/fallback.
Proxies personalizados e substituições somente de cabeçalho continuam sendo compatíveis e não
disparam esse aviso.

### 3) Migrações de estado legado (layout em disco)

O doctor pode migrar layouts antigos em disco para a estrutura atual:

- Armazenamento de sessões + transcrições:
  - de `~/.openclaw/sessions/` para `~/.openclaw/agents/<agentId>/sessions/`
- Agent dir:
  - de `~/.openclaw/agent/` para `~/.openclaw/agents/<agentId>/agent/`
- Estado de autenticação do WhatsApp (Baileys):
  - de `~/.openclaw/credentials/*.json` legado (exceto `oauth.json`)
  - para `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID padrão da conta: `default`)

Essas migrações são de melhor esforço e idempotentes; o doctor emitirá avisos quando
deixar quaisquer pastas legadas para trás como backups. O Gateway/CLI também migra automaticamente
as sessões legadas + agent dir na inicialização, para que histórico/autenticação/modelos sejam colocados no
caminho por agente sem necessidade de executar o doctor manualmente. A autenticação do WhatsApp é intencionalmente migrada
somente via `openclaw doctor`. A normalização de Talk provider/provider-map agora
compara por igualdade estrutural, então diferenças apenas na ordem das chaves não disparam mais
alterações repetidas e sem efeito em `doctor --fix`.

### 3a) Migrações legadas do manifesto de Plugin

O doctor examina todos os manifestos de Plugin instalados em busca de chaves obsoletas
de capacidade no nível superior (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Quando encontradas, ele oferece movê-las para o objeto `contracts`
e reescrever o arquivo do manifesto no local. Essa migração é idempotente;
se a chave `contracts` já tiver os mesmos valores, a chave legada será removida
sem duplicar os dados.

### 3b) Migrações legadas do armazenamento Cron

O doctor também verifica o armazenamento de jobs Cron (`~/.openclaw/cron/jobs.json` por padrão,
ou `cron.store` quando substituído) em busca de formatos antigos de job que o agendador ainda
aceita por compatibilidade.

As limpezas atuais de Cron incluem:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- campos de payload de nível superior (`message`, `model`, `thinking`, ...) → `payload`
- campos de entrega de nível superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- aliases de entrega de payload `provider` → `delivery.channel` explícito
- jobs simples legados de fallback de Webhook com `notify: true` → `delivery.mode="webhook"` explícito com `delivery.to=cron.webhook`

O doctor só migra automaticamente jobs com `notify: true` quando consegue fazê-lo sem
alterar o comportamento. Se um job combinar fallback legado de notificação com um modo de
entrega não Webhook existente, o doctor avisa e deixa esse job para revisão manual.

### 3c) Limpeza de lock de sessão

O doctor examina cada diretório de sessão de agente em busca de arquivos obsoletos de lock de gravação — arquivos deixados
para trás quando uma sessão terminou de forma anormal. Para cada arquivo de lock encontrado, ele relata:
o caminho, PID, se o PID ainda está ativo, idade do lock e se ele é
considerado obsoleto (PID morto ou mais antigo que 30 minutos). No modo `--fix` / `--repair`
ele remove automaticamente arquivos de lock obsoletos; caso contrário, imprime uma observação e
instrui você a executar novamente com `--fix`.

### 4) Verificações de integridade do estado (persistência de sessão, roteamento e segurança)

O diretório de estado é o centro operacional. Se ele desaparecer, você perde
sessões, credenciais, logs e configuração (a menos que tenha backups em outro lugar).

O doctor verifica:

- **Diretório de estado ausente**: avisa sobre perda catastrófica de estado, solicita recriar
  o diretório e lembra que ele não pode recuperar dados ausentes.
- **Permissões do diretório de estado**: verifica capacidade de gravação; oferece reparar permissões
  (e emite uma dica de `chown` quando detecta incompatibilidade de proprietário/grupo).
- **Diretório de estado sincronizado em nuvem no macOS**: avisa quando o estado é resolvido em iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou
  `~/Library/CloudStorage/...`, porque caminhos sustentados por sincronização podem causar E/S mais lenta
  e corridas de lock/sincronização.
- **Diretório de estado em SD ou eMMC no Linux**: avisa quando o estado é resolvido para uma origem de montagem `mmcblk*`,
  porque E/S aleatória em SD ou eMMC pode ser mais lenta e causar
  desgaste mais rápido com gravações de sessão e credenciais.
- **Diretórios de sessão ausentes**: `sessions/` e o diretório de armazenamento de sessão são
  necessários para persistir histórico e evitar falhas `ENOENT`.
- **Incompatibilidade de transcrição**: avisa quando entradas recentes de sessão têm
  arquivos de transcrição ausentes.
- **Sessão principal “JSONL de 1 linha”**: sinaliza quando a transcrição principal tem apenas uma
  linha (o histórico não está se acumulando).
- **Múltiplos diretórios de estado**: avisa quando existem várias pastas `~/.openclaw` em
  diretórios pessoais ou quando `OPENCLAW_STATE_DIR` aponta para outro local (o histórico pode
  se dividir entre instalações).
- **Lembrete de modo remoto**: se `gateway.mode=remote`, o doctor lembra você de executá-lo
  no host remoto (o estado vive lá).
- **Permissões do arquivo de configuração**: avisa se `~/.openclaw/openclaw.json` for
  legível por grupo/mundo e oferece restringir para `600`.

### 5) Integridade da autenticação de modelos (expiração de OAuth)

O doctor inspeciona perfis OAuth no auth store, avisa quando tokens estão
expirando/expirados e pode atualizá-los quando for seguro. Se o perfil
OAuth/token da Anthropic estiver desatualizado, ele sugere uma chave de API Anthropic ou o
caminho Anthropic setup-token.
Prompts de atualização aparecem apenas ao executar de forma interativa (TTY); `--non-interactive`
ignora tentativas de atualização.

Quando uma atualização de OAuth falha permanentemente (por exemplo `refresh_token_reused`,
`invalid_grant` ou quando um provedor informa que você precisa fazer login novamente), o doctor relata
que é necessária reautenticação e imprime o comando exato `openclaw models auth login --provider ...`
a ser executado.

O doctor também relata perfis de autenticação temporariamente inutilizáveis devido a:

- cooldowns curtos (limites de taxa/timeouts/falhas de autenticação)
- desativações mais longas (falhas de faturamento/crédito)

### 6) Validação do modelo de hooks

Se `hooks.gmail.model` estiver definido, o doctor valida a referência de modelo em relação ao
catálogo e à allowlist e avisa quando ela não puder ser resolvida ou não for permitida.

### 7) Reparo de imagem de sandbox

Quando o sandboxing está ativado, o doctor verifica imagens Docker e oferece construir ou
alternar para nomes legados se a imagem atual estiver ausente.

### 7b) Dependências de runtime de Plugin incluído

O doctor verifica dependências de runtime apenas para Plugins incluídos que estão ativos na
configuração atual ou ativados pelo padrão do manifesto incluído, por exemplo
`plugins.entries.discord.enabled: true`, `channels.discord.enabled: true`
legado ou um provedor incluído ativado por padrão. Se alguma estiver ausente, o doctor relata os pacotes e os instala no modo
`openclaw doctor --fix` / `openclaw doctor --repair`. Plugins externos ainda
usam `openclaw plugins install` / `openclaw plugins update`; o doctor não
instala dependências para caminhos arbitrários de Plugin.

### 8) Migrações do serviço Gateway e dicas de limpeza

O doctor detecta serviços legados do gateway (launchd/systemd/schtasks) e
oferece removê-los e instalar o serviço OpenClaw usando a porta atual do gateway.
Ele também pode examinar serviços extras semelhantes ao gateway e imprimir dicas de limpeza.
Serviços OpenClaw gateway nomeados por perfil são tratados como de primeira classe e não
são sinalizados como "extras".

### 8b) Migração do Matrix na inicialização

Quando uma conta do canal Matrix tem uma migração de estado legado pendente ou acionável,
o doctor (no modo `--fix` / `--repair`) cria um snapshot pré-migração e depois
executa as etapas de migração de melhor esforço: migração de estado legado do Matrix e preparação de estado criptografado legado. Ambas as etapas não são fatais; erros são registrados em log e a inicialização continua. No modo somente leitura (`openclaw doctor` sem `--fix`), esta verificação
é totalmente ignorada.

### 8c) Desvio de pareamento e autenticação de dispositivo

O doctor agora inspeciona o estado de pareamento de dispositivo como parte da verificação normal de integridade.

O que ele relata:

- solicitações pendentes de primeiro pareamento
- upgrades pendentes de role para dispositivos já pareados
- upgrades pendentes de scope para dispositivos já pareados
- reparos de incompatibilidade de chave pública quando o ID do dispositivo ainda corresponde, mas a
  identidade do dispositivo não corresponde mais ao registro aprovado
- registros pareados sem um token ativo para uma role aprovada
- tokens pareados cujos scopes desviam da base aprovada de pareamento
- entradas locais em cache de token de dispositivo para a máquina atual que antecedem uma rotação de token do lado do gateway ou carregam metadados obsoletos de scope

O doctor não aprova automaticamente solicitações de pareamento nem faz rotação automática de tokens de dispositivo. Em vez disso, ele
imprime as próximas etapas exatas:

- inspecionar solicitações pendentes com `openclaw devices list`
- aprovar a solicitação exata com `openclaw devices approve <requestId>`
- rotacionar um token novo com `openclaw devices rotate --device <deviceId> --role <role>`
- remover e aprovar novamente um registro obsoleto com `openclaw devices remove <deviceId>`

Isso fecha a lacuna comum de "já pareado, mas ainda recebendo pairing required":
o doctor agora distingue primeiro pareamento de upgrades pendentes de role/scope
e de desvio obsoleto de token/identidade de dispositivo.

### 9) Avisos de segurança

O doctor emite avisos quando um provedor está aberto a DMs sem uma allowlist, ou
quando uma política está configurada de forma perigosa.

### 10) systemd linger (Linux)

Se estiver em execução como um serviço de usuário systemd, o doctor garante que o linger esteja ativado para que o
gateway permaneça ativo após logout.

### 11) Status do workspace (Skills, Plugins e diretórios legados)

O doctor imprime um resumo do estado do workspace para o agente padrão:

- **Status de Skills**: conta Skills elegíveis, com requisitos ausentes e bloqueadas por allowlist.
- **Diretórios legados de workspace**: avisa quando `~/openclaw` ou outros diretórios legados de workspace
  existem ao lado do workspace atual.
- **Status de Plugin**: conta Plugins carregados/desativados/com erro; lista IDs de Plugin para quaisquer
  erros; relata capacidades de Plugins de pacote.
- **Avisos de compatibilidade de Plugin**: sinaliza Plugins que têm problemas de compatibilidade com
  o runtime atual.
- **Diagnósticos de Plugin**: traz à tona quaisquer avisos ou erros de tempo de carregamento emitidos pelo
  registro de Plugin.

### 11b) Tamanho do arquivo bootstrap

O doctor verifica se arquivos bootstrap do workspace (por exemplo `AGENTS.md`,
`CLAUDE.md` ou outros arquivos de contexto injetados) estão próximos ou acima do
orçamento configurado de caracteres. Ele relata por arquivo a contagem de caracteres brutos versus injetados,
porcentagem de truncamento, causa do truncamento (`max/file` ou `max/total`) e total de caracteres injetados
como fração do orçamento total. Quando arquivos são truncados ou estão próximos
do limite, o doctor imprime dicas para ajustar `agents.defaults.bootstrapMaxChars`
e `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Autocomplete do shell

O doctor verifica se a conclusão por tabulação está instalada para o shell atual
(zsh, bash, fish ou PowerShell):

- Se o perfil do shell usar um padrão lento de conclusão dinâmica
  (`source <(openclaw completion ...)`), o doctor o atualiza para a variante mais rápida
  de arquivo em cache.
- Se a conclusão estiver configurada no perfil, mas o arquivo de cache estiver ausente,
  o doctor regenera o cache automaticamente.
- Se nenhuma conclusão estiver configurada, o doctor solicita a instalação
  (somente modo interativo; ignorado com `--non-interactive`).

Execute `openclaw completion --write-state` para regenerar o cache manualmente.

### 12) Verificações de autenticação do Gateway (token local)

O doctor verifica a prontidão da autenticação por token do gateway local.

- Se o modo token precisar de um token e nenhuma fonte de token existir, o doctor oferece gerar um.
- Se `gateway.auth.token` for gerenciado por SecretRef, mas estiver indisponível, o doctor avisa e não o sobrescreve com texto simples.
- `openclaw doctor --generate-gateway-token` força a geração somente quando nenhum token SecretRef estiver configurado.

### 12b) Reparos somente leitura com reconhecimento de SecretRef

Alguns fluxos de reparo precisam inspecionar credenciais configuradas sem enfraquecer o comportamento de falha rápida em runtime.

- `openclaw doctor --fix` agora usa o mesmo modelo resumido somente leitura com reconhecimento de SecretRef que os comandos da família status para reparos direcionados de configuração.
- Exemplo: o reparo de `allowFrom` / `groupAllowFrom` `@username` do Telegram tenta usar credenciais configuradas do bot quando disponíveis.
- Se o token do bot do Telegram estiver configurado via SecretRef, mas indisponível no caminho atual do comando, o doctor informa que a credencial está configurada, porém indisponível, e ignora a resolução automática em vez de falhar ou relatar incorretamente o token como ausente.

### 13) Verificação de integridade do Gateway + reinício

O doctor executa uma verificação de integridade e oferece reiniciar o gateway quando ele parece
não íntegro.

### 13b) Prontidão da busca em memória

O doctor verifica se o provedor configurado de embeddings para busca em memória está pronto
para o agente padrão. O comportamento depende do backend e provedor configurados:

- **Backend QMD**: sonda se o binário `qmd` está disponível e pode ser iniciado.
  Caso contrário, imprime orientação de correção incluindo o pacote npm e uma opção manual de caminho de binário.
- **Provedor local explícito**: verifica se existe um arquivo de modelo local ou uma URL de modelo remoto/baixável reconhecida. Se estiver ausente, sugere alternar para um provedor remoto.
- **Provedor remoto explícito** (`openai`, `voyage` etc.): verifica se uma chave de API está
  presente no ambiente ou no auth store. Imprime dicas práticas de correção se estiver ausente.
- **Provedor automático**: verifica primeiro a disponibilidade de modelo local e depois tenta cada provedor remoto na ordem de seleção automática.

Quando um resultado de sondagem do gateway está disponível (o gateway estava íntegro no momento da
verificação), o doctor cruza esse resultado com a configuração visível pela CLI e aponta
qualquer discrepância.

Use `openclaw memory status --deep` para verificar a prontidão de embeddings em tempo de execução.

### 14) Avisos de status de canal

Se o gateway estiver íntegro, o doctor executa uma sondagem de status de canal e relata
avisos com correções sugeridas.

### 15) Auditoria + reparo de configuração do supervisor

O doctor verifica a configuração instalada do supervisor (launchd/systemd/schtasks) em busca de
padrões ausentes ou desatualizados (por exemplo, dependências `network-online` do systemd e
atraso de reinício). Quando encontra uma incompatibilidade, ele recomenda uma atualização e pode
reescrever o arquivo de serviço/tarefa para os padrões atuais.

Observações:

- `openclaw doctor` solicita confirmação antes de reescrever a configuração do supervisor.
- `openclaw doctor --yes` aceita os prompts de reparo padrão.
- `openclaw doctor --repair` aplica correções recomendadas sem prompts.
- `openclaw doctor --repair --force` sobrescreve configurações personalizadas do supervisor.
- Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação/reparo de serviço do doctor valida o SecretRef, mas não persiste valores resolvidos de token em texto simples nos metadados de ambiente do serviço supervisor.
- Se a autenticação por token exigir um token e o token SecretRef configurado não puder ser resolvido, o doctor bloqueia o caminho de instalação/reparo com orientação prática.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, o doctor bloqueia instalação/reparo até que o modo seja definido explicitamente.
- Para unidades user-systemd no Linux, as verificações de desvio de token do doctor agora incluem fontes `Environment=` e `EnvironmentFile=` ao comparar metadados de autenticação do serviço.
- Você sempre pode forçar uma regravação completa via `openclaw gateway install --force`.

### 16) Diagnósticos de runtime + porta do Gateway

O doctor inspeciona o runtime do serviço (PID, último status de saída) e avisa quando o
serviço está instalado, mas não está realmente em execução. Ele também verifica colisões de porta
na porta do gateway (padrão `18789`) e relata causas prováveis (gateway já em
execução, túnel SSH).

### 17) Boas práticas de runtime do Gateway

O doctor avisa quando o serviço do gateway é executado em Bun ou em um caminho de Node gerenciado por versão
(`nvm`, `fnm`, `volta`, `asdf` etc.). Canais WhatsApp + Telegram exigem Node,
e caminhos de gerenciador de versão podem quebrar após upgrades porque o serviço não
carrega a inicialização do seu shell. O doctor oferece migrar para uma instalação de Node do sistema quando
disponível (Homebrew/apt/choco).

### 18) Gravação da configuração + metadados do assistente

O doctor persiste quaisquer alterações de configuração e registra metadados do assistente para marcar a
execução do doctor.

### 19) Dicas de workspace (backup + sistema de memória)

O doctor sugere um sistema de memória do workspace quando ausente e imprime uma dica de backup
se o workspace ainda não estiver sob git.

Consulte [/concepts/agent-workspace](/pt-BR/concepts/agent-workspace) para um guia completo sobre
estrutura do workspace e backup com git (GitHub ou GitLab privado recomendado).

## Relacionado

- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
- [Runbook do Gateway](/pt-BR/gateway)
