---
read_when:
    - Configurando binários seguros ou perfis personalizados de binários seguros
    - Encaminhamento de aprovações para Slack/Discord/Telegram ou outros canais de chat
    - Implementando um cliente nativo de aprovação para um canal
summary: 'Aprovações avançadas de execução: binários seguros, vinculação de interpretador, encaminhamento de aprovações, entrega nativa'
title: Aprovações de execução — avançado
x-i18n:
    generated_at: "2026-07-12T15:43:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 99f123c7663378cc30ff9b6498c5cbc18ce9f20e9ac769755bab23af69ef1c7d
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Tópicos avançados de aprovação de execução: o caminho rápido `safeBins`, a vinculação
de interpretador/runtime e o encaminhamento de aprovações para canais de chat (incluindo entrega nativa).
Para a política principal e o fluxo de aprovação, consulte [Aprovações de execução](/pt-BR/tools/exec-approvals).

## Binários seguros (somente stdin)

`tools.exec.safeBins` nomeia binários **somente stdin** (por exemplo, `cut`) que
são executados no modo de lista de permissões **sem** entradas explícitas nessa lista. Binários seguros rejeitam
argumentos posicionais de arquivo e tokens semelhantes a caminhos, portanto só podem operar sobre o
fluxo de entrada. Trate isso como um caminho rápido restrito para filtros de fluxo, não como uma
lista geral de confiança.

<Warning>
**Não** adicione binários de interpretadores ou runtimes (por exemplo, `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) a `safeBins`. Se um comando puder avaliar código,
executar subcomandos ou ler arquivos por definição, prefira entradas explícitas na lista de permissões
e mantenha os prompts de aprovação habilitados. Binários seguros personalizados devem definir um
perfil explícito em `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Binários seguros padrão:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` e `sort` não estão na lista padrão. Se você optar por incluí-los, mantenha entradas explícitas
na lista de permissões para seus fluxos de trabalho que não usam stdin. Para `grep` no modo de binário seguro,
forneça o padrão com `-e`/`--regexp`; a forma posicional do padrão é rejeitada
para impedir que operandos de arquivo sejam introduzidos como argumentos posicionais ambíguos.

### Validação de argv e flags negadas

A validação é determinística apenas com base na forma de argv (sem verificações de existência
no sistema de arquivos do host), o que impede o comportamento de oráculo de existência de arquivos decorrente de
diferenças entre permissão e negação. Opções orientadas a arquivos são negadas para binários seguros padrão; opções
longas usam validação com falha fechada (flags desconhecidas e abreviações ambíguas são
rejeitadas). Flags booleanas reconhecidas e somente leitura dos binários padrão (por exemplo,
`wc -l`, `tr -d`, `uniq -c`) são aceitas, enquanto flags curtas não reconhecidas permanecem
com falha fechada e recorrem à aprovação manual.

Flags negadas por perfil de binário seguro:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `tail`: `--follow`, `--retry`, `-F`, `-f`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Binários seguros também forçam os tokens de argv a serem tratados como **texto literal** no momento da execução
(sem expansão de curingas e sem expansão de `$VARS`) em segmentos somente stdin, de modo que
padrões como `*` ou `$HOME/...` não possam ser usados para introduzir leituras de arquivos. `awk`,
`sed` e `jq` são sempre negados como binários seguros porque sua semântica não pode ser
validada como somente stdin: `jq` pode ler dados do ambiente e carregar código jq de
módulos ou arquivos de inicialização. Em vez de `safeBins`, use uma entrada explícita na lista de permissões ou um prompt de aprovação
para essas ferramentas.

### Diretórios confiáveis de binários

Binários seguros devem ser resolvidos a partir de diretórios confiáveis de binários (padrões do sistema mais
`tools.exec.safeBinTrustedDirs` opcional). Entradas de `PATH` nunca são consideradas confiáveis automaticamente.
Os diretórios confiáveis padrão são intencionalmente mínimos: `/bin`, `/usr/bin`. Se
o executável do binário seguro estiver em caminhos de gerenciadores de pacotes/usuários (por exemplo,
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), adicione-os
explicitamente a `tools.exec.safeBinTrustedDirs`.

### Encadeamento de shell, wrappers e multiplexadores

O encadeamento de shell (`&&`, `||`, `;`) é permitido quando cada segmento de nível superior
satisfaz a lista de permissões (incluindo binários seguros ou permissão automática de Skills). Redirecionamentos
continuam sem suporte no modo de lista de permissões. A substituição de comandos (`$()` / acentos graves) é
rejeitada durante a análise da lista de permissões, inclusive dentro de aspas duplas; use aspas simples
se precisar do texto literal `$()`.

Nas aprovações do aplicativo complementar do macOS, texto bruto de shell contendo sintaxe de controle ou
expansão do shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) é
tratado como não correspondente à lista de permissões, a menos que o próprio binário do shell esteja nessa lista.

Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), substituições de ambiente no escopo da solicitação são
reduzidas a uma pequena lista de permissões explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Para decisões `allow-always` no modo de lista de permissões, wrappers transparentes de despacho
(por exemplo, `env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) persistem o
caminho do executável interno em vez do caminho do wrapper. Multiplexadores de shell
(`busybox`, `toybox`) são desembrulhados da mesma forma para applets de shell (`sh`, `ash` etc.).
Se um wrapper ou multiplexador não puder ser desembrulhado com segurança, nenhuma entrada na lista de permissões
será persistida automaticamente.

Se você adicionar interpretadores como `python3` ou `node` à lista de permissões, prefira
`tools.exec.strictInlineEval=true` para que a avaliação inline ainda exija uma aprovação
explícita. No modo estrito, `allow-always` ainda pode persistir invocações benignas de
interpretador/script, mas meios de avaliação inline não são persistidos
automaticamente.

### Binários seguros versus lista de permissões

| Tópico           | `tools.exec.safeBins`                                        | Lista de permissões (`exec-approvals.json`)                                                          |
| ---------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Objetivo         | Permitir automaticamente filtros restritos de stdin          | Confiar explicitamente em executáveis específicos                                                     |
| Tipo de correspondência | Nome do executável + política de argv do binário seguro | Glob do caminho resolvido do executável ou glob apenas do nome do comando para comandos invocados via PATH |
| Escopo dos argumentos | Restrito pelo perfil do binário seguro e pelas regras de tokens literais | Correspondência de caminho por padrão; `argPattern` opcional pode restringir o argv analisado |
| Exemplos típicos | `head`, `tail`, `tr`, `wc`                                   | `jq`, `python3`, `node`, `ffmpeg`, CLIs personalizadas                                               |
| Melhor uso       | Transformações de texto de baixo risco em pipelines          | Qualquer ferramenta com comportamento mais amplo ou efeitos colaterais                               |

Local da configuração:

- `safeBins` vem da configuração (`tools.exec.safeBins` ou `agents.list[].tools.exec.safeBins` por agente).
- `safeBinTrustedDirs` vem da configuração (`tools.exec.safeBinTrustedDirs` ou `agents.list[].tools.exec.safeBinTrustedDirs` por agente).
- `safeBinProfiles` vem da configuração (`tools.exec.safeBinProfiles` ou `agents.list[].tools.exec.safeBinProfiles` por agente). Chaves de perfil por agente substituem chaves globais.
- As entradas da lista de permissões ficam no arquivo local de aprovações do host, em `agents.<id>.allowlist` (ou por meio da Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` emite um aviso com `tools.exec.safe_bins_interpreter_unprofiled` quando binários de interpretador/runtime aparecem em `safeBins` sem perfis explícitos.
- `openclaw doctor --fix` pode criar a estrutura de entradas personalizadas ausentes em `safeBinProfiles.<bin>` como `{}` (revise e restrinja depois). Binários de interpretador/runtime não têm sua estrutura criada automaticamente.

Exemplo de perfil personalizado:
__OC_I18N_900000__
## Comandos de interpretador/runtime

Execuções de interpretador/runtime respaldadas por aprovação são intencionalmente conservadoras:

- O contexto exato de argv/cwd/env é sempre vinculado.
- Formas diretas de script de shell e arquivo direto de runtime são vinculadas, com o melhor esforço possível, a um snapshot concreto de um
  arquivo local.
- Formas comuns de wrapper de gerenciador de pacotes que ainda resolvem para um único arquivo local direto (por exemplo,
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) são desembrulhadas antes da vinculação.
- Se o OpenClaw não conseguir identificar exatamente um arquivo local concreto para um comando de interpretador/runtime
  (por exemplo, scripts de pacote, formas de avaliação, cadeias de carregadores específicas de runtime ou formas ambíguas com vários arquivos),
  a execução respaldada por aprovação será negada, em vez de alegar uma cobertura semântica que
  não possui.
- Para esses fluxos de trabalho, prefira isolamento em sandbox, um limite de host separado ou um fluxo de trabalho
  completo/lista de permissões explicitamente confiável em que o operador aceite a semântica mais ampla do runtime.

Quando aprovações são necessárias, a ferramenta de execução retorna imediatamente com um ID de aprovação. Use esse ID para
correlacionar eventos de sistema posteriores da execução aprovada (`Exec finished` e `Exec running`, quando configurado).
Se nenhuma decisão chegar antes do tempo limite, a solicitação será tratada como um tempo limite de aprovação e
apresentada como uma negação terminal do comando do host. Para aprovações assíncronas do agente principal com uma
sessão de origem, o OpenClaw também retoma essa sessão com um acompanhamento interno para que o agente perceba que
o comando não foi executado, em vez de tentar corrigir posteriormente um resultado ausente. Aprovações de execução pendentes expiram
após 30 minutos por padrão.

### Comportamento da entrega de acompanhamento

Depois que uma execução assíncrona aprovada termina, o OpenClaw envia um turno de acompanhamento `agent` para a mesma sessão.
Aprovações assíncronas negadas usam o mesmo caminho de acompanhamento da sessão principal para o status de negação, mas
não registram transferências elevadas de runtime nem executam o comando. Negações sem uma sessão principal
retomável são suprimidas ou relatadas por uma rota direta segura, quando houver uma.

- Se houver um destino externo válido de entrega (canal disponível para entrega mais destino `to`), a entrega do acompanhamento usará esse canal.
- Em fluxos somente de webchat ou de sessão interna sem destino externo, a entrega do acompanhamento permanecerá apenas na sessão (`deliver: false`).
- Se um chamador solicitar explicitamente entrega externa estrita sem um canal externo resolvível, a solicitação falhará com `INVALID_REQUEST`.
- Se `bestEffortDeliver` estiver habilitado e nenhum canal externo puder ser resolvido, a entrega será rebaixada para somente sessão em vez de falhar.

## Encaminhamento de aprovações para canais de chat

Você pode encaminhar prompts de aprovação de execução para qualquer canal de chat (incluindo canais de plugins) e aprová-los
com `/approve`. Isso usa o pipeline normal de entrega de saída.

Configuração:
__OC_I18N_900001__
Responda no chat:
__OC_I18N_900002__
O comando `/approve` processa aprovações de execução e de plugins. Se o ID não corresponder a uma aprovação de execução pendente, ele verificará automaticamente as aprovações de plugins. Esse fallback é limitado a falhas de "aprovação não encontrada"; uma negação/um erro real de aprovação de execução não tenta novamente silenciosamente como uma aprovação de plugin.

### Encaminhamento de aprovações de plugins

O encaminhamento de aprovações de plugins usa o mesmo pipeline de entrega das aprovações de execução, mas possui sua própria
configuração independente em `approvals.plugin`. Habilitar ou desabilitar uma delas não afeta a outra.
Para conhecer o comportamento de criação de plugins, os campos da solicitação e a semântica das decisões, consulte
[Solicitações de permissão de plugins](/plugins/plugin-permission-requests).
__OC_I18N_900003__
O formato da configuração é idêntico ao de `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` e `targets` funcionam da mesma maneira.

Os canais que oferecem suporte a respostas interativas compartilhadas renderizam os mesmos botões de aprovação tanto para aprovações de exec quanto de
plugins. Os canais sem interface interativa compartilhada usam texto simples com instruções de
`/approve` como alternativa. As solicitações de aprovação de plugins podem restringir as decisões disponíveis: as interfaces de aprovação usam
o conjunto de decisões declarado pela solicitação, e o Gateway rejeita tentativas de enviar uma decisão que não tenha
sido oferecida.

### Aprovações no mesmo chat em qualquer canal

Quando uma solicitação de aprovação de exec ou de plugin se origina em uma interface de chat que permite entrega, esse mesmo chat
pode aprová-la com `/approve` por padrão. Isso se aplica ao Slack, Matrix, Microsoft Teams e a
chats semelhantes que permitem entrega, além dos fluxos existentes da interface Web e da interface de terminal, usando o
modelo normal de autenticação do canal para essa conversa. Se o chat de origem já puder enviar comandos
e receber respostas, as solicitações de aprovação não precisarão mais de um adaptador de entrega nativo separado apenas para
permanecerem pendentes.

Discord, Telegram e QQ bot também oferecem suporte a `/approve` no mesmo chat, mas esses canais ainda usam sua
lista de aprovadores resolvida para autorização, mesmo quando a entrega nativa de aprovações está desativada.

### Entrega nativa de aprovações

Alguns canais também podem atuar como clientes nativos de aprovação: Discord, Slack, Telegram, Matrix e QQ bot.
Os clientes nativos adicionam mensagens diretas aos aprovadores, distribuição no chat de origem e uma experiência interativa de aprovação específica do canal,
além do fluxo compartilhado de `/approve` no mesmo chat.

Quando cartões/botões de aprovação nativos estão disponíveis, essa interface nativa é o principal caminho voltado ao agente.
O agente não deve também repetir um comando `/approve` duplicado no chat em texto simples, a menos que o resultado da ferramenta indique
que as aprovações pelo chat estão indisponíveis ou que a aprovação manual seja o único caminho restante.

Se um cliente nativo de aprovação estiver configurado, mas nenhum runtime nativo estiver ativo para o canal de
origem, o OpenClaw manterá visível a solicitação determinística local de `/approve`. Se o runtime nativo estiver
ativo e tentar realizar a entrega, mas nenhum destino receber o cartão, o OpenClaw enviará um aviso alternativo
no mesmo chat com o comando exato `/approve <id> <decision>`, para que a solicitação ainda possa ser resolvida.

Modelo genérico:

- a política de exec do host ainda decide se a aprovação de exec é necessária
- `approvals.exec` controla o encaminhamento das solicitações de aprovação para outros destinos de chat
- `channels.<channel>.execApprovals` controla se os clientes nativos específicos de canal do Discord, Slack, Telegram, QQ bot e semelhantes
  estão habilitados
- as aprovações de plugins do Slack podem usar o cliente nativo de aprovação do Slack quando a solicitação vem do Slack
  e os aprovadores de plugins do Slack são resolvidos; `approvals.plugin` também pode encaminhar aprovações de plugins para sessões
  ou destinos do Slack, mesmo quando as aprovações de exec do Slack estão desativadas
- os cartões nativos de aprovação do Google Chat processam aprovações de exec e de plugins originadas de espaços ou
  conversas do Google Chat quando aprovadores estáveis `users/<id>` são resolvidos por meio de `dm.allowFrom` ou
  `defaultTo`; eles não usam eventos de reação para decisões
- a entrega de aprovações por reação no WhatsApp e no Signal é controlada por `approvals.exec` e
  `approvals.plugin`; eles não têm blocos `channels.<channel>.execApprovals`

Os clientes nativos de aprovação habilitam automaticamente a entrega prioritária por mensagem direta quando todas estas condições são verdadeiras:

- o canal oferece suporte à entrega nativa de aprovações
- os aprovadores podem ser resolvidos por meio de `execApprovals.approvers` explícitos ou da
  identidade do proprietário, como `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` não está definido ou é `"auto"`

Defina `enabled: false` para desativar explicitamente um cliente nativo de aprovação. Defina `enabled: true` para forçar
sua ativação quando os aprovadores forem resolvidos. A entrega pública no chat de origem permanece explícita por meio de
`channels.<channel>.execApprovals.target`. Quando o `target` nativo habilita a entrega no chat de origem,
as solicitações de aprovação incluem o texto do comando.

Perguntas frequentes: [Por que existem duas configurações de aprovação de exec para aprovações pelo chat?](/help/faq-first-run)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`
- QQ bot: `channels.qqbot.execApprovals.*`
- Google Chat: configure aprovadores estáveis com `channels.googlechat.dm.allowFrom` ou
  `channels.googlechat.defaultTo`; nenhum bloco `execApprovals` é necessário
- WhatsApp: use `approvals.exec` e `approvals.plugin` para encaminhar solicitações de aprovação ao WhatsApp
- Signal: use `approvals.exec` e `approvals.plugin` para encaminhar solicitações de aprovação ao Signal

Encaminhamento específico de clientes nativos:

- por padrão, o Telegram usa mensagens diretas aos aprovadores (`target: "dm"`). Altere para `channel` ou `both` para também exibir
  solicitações de aprovação no chat/tópico de origem do Telegram. Para tópicos de fórum do Telegram, o OpenClaw
  preserva o tópico para a solicitação de aprovação e o acompanhamento após a aprovação.
- os aprovadores do Discord e do Telegram podem ser explícitos (`execApprovals.approvers`) ou inferidos de
  `commands.ownerAllowFrom`; somente aprovadores resolvidos podem aprovar ou negar.
- os aprovadores do Slack podem ser explícitos (`execApprovals.approvers`) ou inferidos de
  `commands.ownerAllowFrom`. As mensagens diretas de aprovação de plugins do Slack usam os aprovadores de plugins do Slack definidos por `allowFrom`
  e o encaminhamento padrão da conta, não os aprovadores de exec do Slack. Os botões nativos do Slack preservam o tipo do ID de aprovação,
  portanto IDs `plugin:` podem resolver aprovações de plugins sem uma segunda camada alternativa local do Slack.
- os cartões nativos do Google Chat preservam a alternativa manual `/approve` no texto da mensagem, mas os retornos de chamada
  dos botões do cartão carregam apenas tokens de ação opacos; o ID de aprovação e a decisão são recuperados do
  estado pendente no servidor.
- as aprovações por emoji do WhatsApp processam solicitações de exec e de plugins quando a família correspondente de
  encaminhamento de nível superior é direcionada ao WhatsApp. As solicitações de origem nativa são vinculadas diretamente; a entrega no
  modo de destino compartilhado vincula os mesmos metadados tipados de aprovação ao recibo aceito da mensagem do WhatsApp.
- as aprovações por reação do Signal processam solicitações de exec e de plugins somente quando a família correspondente de
  encaminhamento de nível superior está habilitada e é direcionada ao Signal. As aprovações diretas de exec do Signal no mesmo chat podem
  suprimir a alternativa local `/approve` sem aprovadores explícitos; a resolução por reação do Signal
  ainda exige aprovadores explícitos do Signal definidos por `channels.signal.allowFrom` ou `defaultTo`.
- o encaminhamento nativo por mensagem direta/canal e os atalhos de reação do Matrix processam aprovações de exec e de plugins;
  a autorização de plugins ainda vem de `channels.matrix.dm.allowFrom`. As solicitações nativas do Matrix
  incluem conteúdo de evento personalizado `com.openclaw.approval` no primeiro evento da solicitação para que clientes Matrix
  compatíveis com o OpenClaw possam ler o estado estruturado da aprovação, enquanto clientes padrão mantêm a alternativa
  em texto simples `/approve`.
- os botões nativos de aprovação do Discord e do Telegram carregam um tipo explícito de proprietário de exec ou plugin nos
  dados de retorno de chamada privados do transporte e resolvem somente esse proprietário. Controles `/approve` mais antigos que não têm
  um tipo permanecem como um caminho de compatibilidade limitado: eles tentam somente os tipos de proprietário que o ator pode aprovar,
  continuam apenas após um resultado de aprovação não encontrada e nunca inferem a propriedade pelo ID da aprovação.
- o solicitante não precisa ser um aprovador.
- se nenhuma interface do operador ou cliente de aprovação configurado puder aceitar a solicitação, a solicitação usará
  `askFallback` como alternativa.

Comandos confidenciais de grupo exclusivos do proprietário, como `/diagnostics` e `/export-trajectory`, usam
encaminhamento privado do proprietário para solicitações de aprovação e resultados finais. Primeiro, o OpenClaw tenta uma rota privada na
mesma interface em que o proprietário executou o comando. Se essa interface não tiver uma rota privada do proprietário, ele usa
como alternativa a primeira rota disponível do proprietário em `commands.ownerAllowFrom`, permitindo que um comando de grupo do Discord
ainda envie a aprovação e o resultado para a mensagem direta do proprietário no Telegram quando o Telegram estiver configurado como
interface privada principal. O chat em grupo recebe apenas uma breve confirmação.

Consulte:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)
- [QQ bot](/channels/qqbot)

### Aplicativos móveis oficiais para operadores

Os aplicativos oficiais para iOS e Android também podem analisar aprovações de exec pendentes pertencentes ao Gateway
quando uma conexão `operator.admin` é usada ou quando o dispositivo
`operator.approvals` pareado tiver sido explicitamente escolhido como destino pela solicitação. Eles leem
o mesmo registro durável e sanitizado usado pela
interface de controle, enviam uma decisão que reconhece o tipo e exibem o resultado canônico
da primeira resposta do Gateway. O Apple Watch espelha essas solicitações de aprovação por meio
do iPhone pareado, com ações para permitir uma vez e negar. O modo Gateway direto do Watch
não analisa aprovações.

A perda de uma confirmação de resolução não torna autoritativa a escolha enviada:
o aplicativo desativa os controles e lê o registro novamente. Se outra interface
tiver prevalecido, o aplicativo exibirá essa decisão registrada. As solicitações pendentes permanecem vinculadas ao
Gateway que as emitiu, portanto, trocar o Gateway ativo não pode redirecionar um
ID de aprovação antigo.

### Fluxo de IPC do macOS
__OC_I18N_900004__
Observações de segurança:

- Modo do soquete Unix `0600`, token armazenado em `exec-approvals.json`.
- Verificação de par com o mesmo UID.
- Desafio/resposta (nonce + token HMAC + hash da solicitação) + TTL curto.

## Perguntas frequentes

### Quando `accountId` e `threadId` seriam usados em um destino de aprovação?

Use `accountId` quando o canal tiver várias identidades configuradas e a solicitação de aprovação precisar
ser enviada por uma conta específica. Use `threadId` quando o destino oferecer suporte a tópicos ou
conversas e a solicitação precisar permanecer nessa conversa, em vez de ser enviada ao chat de nível superior.

Um caso concreto no Telegram é um supergrupo de operações com tópicos de fórum e duas contas de bot do
Telegram. O valor `to` identifica o supergrupo, `accountId` seleciona a conta do bot e `threadId`
seleciona o tópico do fórum:
__OC_I18N_900005__
Com essa configuração, as aprovações de exec encaminhadas são publicadas pela conta `ops-bot` do Telegram no tópico
`77` do chat `-1001234567890`. Um destino sem `accountId` usa a conta padrão do canal, e
um destino sem `threadId` publica no destino de nível superior.

### Quando as aprovações são enviadas a uma sessão, qualquer pessoa nessa sessão pode aprová-las?

Não. A entrega à sessão controla apenas onde a solicitação aparece. Por si só, ela não autoriza todos os
participantes desse chat a aprovar.

Para `/approve` genérico no mesmo chat, o remetente já deve estar autorizado a executar comandos nessa
sessão do canal. Se o canal expuser aprovadores explícitos de aprovação, esses aprovadores poderão autorizar
a ação `/approve`, mesmo que não tenham autorização para outros comandos nessa sessão.

Alguns canais são mais rigorosos. Discord, Telegram, Matrix, mensagens diretas nativas de aprovação do Slack e clientes nativos
de aprovação semelhantes usam suas listas de aprovadores resolvidas para a autorização de aprovação. Por exemplo,
uma solicitação de aprovação em um tópico de fórum do Telegram pode estar visível para todos no tópico, mas somente IDs numéricos
de usuários do Telegram resolvidos por meio de `channels.telegram.execApprovals.approvers` ou
`commands.ownerAllowFrom` podem aprová-la ou negá-la.

## Relacionado

- [Aprovações de exec](/pt-BR/tools/exec-approvals) — política central e fluxo de aprovação
- [Ferramenta de exec](/pt-BR/tools/exec)
- [Modo elevado](/pt-BR/tools/elevated)
- [Skills](/pt-BR/tools/skills) — comportamento de permissão automática baseado em skills
