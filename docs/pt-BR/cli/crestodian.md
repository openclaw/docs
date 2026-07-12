---
read_when:
    - Você concluiu a configuração da inferência e quer que o Crestodian configure o restante
    - Você precisa inspecionar ou reparar o OpenClaw com o agente de configuração local
    - Você está projetando ou habilitando o modo de recuperação do canal de mensagens
summary: Referência da CLI e modelo de segurança do assistente de configuração e reparo do Crestodian com suporte de inferência
title: Crestodian
x-i18n:
    generated_at: "2026-07-11T23:47:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af4861a48fb26159cb8e0c29d08ab5c3776283eb5392dcbe08c9a28d01f4abf5
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

O Crestodian conversacional é o agente local de configuração, reparo e
configuração de opções do OpenClaw. Ele inicia somente depois que o modelo padrão efetivo conclui uma interação real.
Instalações novas estabelecem a inferência primeiro; configurações malformadas permanecem no
fluxo clássico do doctor.

## Quando ele inicia

Executar `openclaw` sem subcomando direciona o fluxo com base no estado da configuração:

- Configuração ausente ou existente sem definições feitas pelo usuário (vazia ou contendo apenas as chaves `$schema`/`meta`): inicia a integração guiada com verificação de IA em tempo real.
- A configuração existe, mas falha na validação: inicia a integração clássica, que informa os problemas e orienta você a usar `openclaw doctor`.
- A configuração existe e é válida: abre a TUI normal do agente. Um Gateway configurado e acessível cujo agente padrão tenha um modelo vai diretamente para essa interface
  sem integração nem Crestodian. Use `/crestodian` dentro da TUI ou execute
  `openclaw crestodian` diretamente para acessar o Crestodian posteriormente.

Executar `openclaw crestodian` primeiro testa em tempo real o modelo padrão configurado. Uma interação bem-sucedida inicia o Crestodian. Uma falha interativa abre a configuração guiada de inferência e transfere o controle ao Crestodian depois que um candidato é aprovado. Solicitações pontuais, em JSON e outras solicitações não interativas falham com instruções para executar `openclaw onboard` quando a inferência não está disponível. `openclaw --help` e `openclaw --version` mantêm seus fluxos rápidos normais.

A execução não interativa de `openclaw` sem subcomando (sem TTY) é encerrada com uma mensagem curta em vez de exibir a ajuda principal: ela direciona para a integração não interativa em uma instalação nova ou inválida, ou para `openclaw agent --local ...` quando a configuração é válida.

`openclaw onboard --modern` continua sendo um alias de compatibilidade para o Crestodian, mas usa o mesmo bloqueio de inferência: uma inferência funcional abre o chat, falhas interativas iniciam a configuração guiada de inferência e falhas não interativas encerram com orientações sobre a integração. `openclaw onboard --classic` abre o assistente completo passo a passo.

## O que o Crestodian exibe

O Crestodian interativo abre o mesmo ambiente de TUI que `openclaw tui`, com um backend de chat do Crestodian. A saudação inicial abrange:

- a validade da configuração e o agente padrão
- o modelo verificado que o Crestodian está usando
- a acessibilidade do Gateway conforme a primeira sondagem de inicialização
- a próxima ação de depuração recomendada

Ele não despeja segredos nem carrega comandos de CLI de plugins apenas para iniciar.

Use `status` para obter o inventário detalhado: caminho da configuração, caminhos da documentação e do código-fonte, sondagens da CLI local, presença de chaves/tokens, agentes, modelo e detalhes do Gateway.

O Crestodian usa a mesma descoberta de referências que os agentes normais: em um checkout do Git, ele aponta para `docs/` local e para a árvore de código-fonte; em uma instalação via npm, ele usa a documentação incluída e fornece um link para [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), com a orientação de consultar o código-fonte quando a documentação não for suficiente.

## Exemplos

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work" --yes
openclaw crestodian --message "set default model openai/gpt-5.6" --yes
openclaw onboard --modern
```

Dentro da TUI do Crestodian:

```text
status
health
doctor
validate config
setup
setup workspace ~/Projects/work
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
configure model provider
set default model openai/gpt-5.6
channels
channel info slack
connect slack
open channel wizard for slack
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Operações e aprovação

O Crestodian usa operações tipadas em vez de editar a configuração de maneira improvisada.

Operações somente leitura são executadas imediatamente: exibir a visão geral, listar agentes, listar plugins instalados, pesquisar plugins no ClawHub, exibir o status do modelo/backend, executar verificações de status/integridade, verificar a acessibilidade do Gateway, executar o doctor sem correções interativas, validar a configuração e exibir o caminho do log de auditoria.

Iniciar a configuração guiada de um canal (`connect telegram`) também é executado imediatamente. Seu assistente coleta respostas explícitas e é responsável pelas gravações resultantes.

Operações persistentes exigem aprovação durante a conversa (ou `--yes` para um comando direto): gravar a configuração, usar `config set`, usar `config set-ref`, inicializar a configuração/integração, alterar o modelo padrão, iniciar/parar/reiniciar o Gateway, criar agentes e instalar plugins.

Os reparos do doctor não estão disponíveis dentro do Crestodian porque podem reescrever o provedor, a autenticação ou a rota de inferência do agente padrão que sustenta a sessão. Saia do Crestodian e execute `openclaw doctor --fix` em um terminal. O `doctor` somente leitura continua disponível dentro do Crestodian.

Novos agentes herdam a rota padrão de inferência verificada em tempo real. O ID de agente `crestodian` é reservado ao custodiante virtual privilegiado e não pode ser criado como um agente normal.

`config set` e `config set-ref` não podem alterar o estado da rota de inferência,
incluindo credenciais do provedor de inferência, `auth.*` no nível superior, catálogos de modelos,
backends de CLI, rotas de modelo padrão/por agente, parâmetros/ferramentas do agente ou
`tools.*` na raiz. Gravações brutas em `env.*`, `secrets.*`, `plugins.*` e `$include`
também são recusadas porque podem substituir a resolução de credenciais ou a ativação
do provedor. A autenticação de Gateway e de canal continua sendo uma superfície normal de configuração. Use fluxos tipados de plugin/canal e
`set default model <provider/model>` para uma rota já
configurada; ele testa a rota em tempo real antes de salvá-la. Para configurar ou
reparar o acesso de provedor/autenticação, saia do Crestodian e execute `openclaw onboard`.

A desinstalação de plugins é recusada dentro do Crestodian porque remover um plugin
de provedor pode desativar a rota de inferência que sustenta a sessão. Saia do Crestodian
e execute `openclaw plugins uninstall <id>` em um terminal.

A aprovação é dada com suas próprias palavras: respostas inequívocas ("sim", "claro", "pode prosseguir", "agora não") são resolvidas a partir de uma lista determinística fechada. Quando a rota configurada oferece suporte a uma chamada de conclusão separada, outras respostas podem ser classificadas usando somente sua mensagem e a proposta pendente — nunca pelo próprio modelo da conversa, que não pode aprovar a si mesmo. Respostas não classificadas ou ambíguas mantêm a proposta pendente, e a conversa pergunta novamente.

As gravações aplicadas são registradas em `~/.openclaw/audit/crestodian.jsonl`. A descoberta não é auditada; somente operações aplicadas e gravações são.

A configuração de canal pode ser executada como uma conversa hospedada até chegar a um segredo. A
TUI local do Crestodian não aceita respostas confidenciais do assistente porque a entrada
do chat no terminal fica visível. Ela oferece `open channel wizard` imediatamente, levando
o canal selecionado para o assistente de terminal com entrada mascarada; você também pode executar
`openclaw channels add --channel <channel>` posteriormente.

### Alternância para a configuração mascarada de canal

O chat local pode transferir o controle para o assistente mascarado de canal:

```text
open channel wizard for slack
channel info slack
```

`open channel wizard for <channel>` abre a configuração mascarada do canal depois que a TUI
de chat é fechada. Use `channel info <channel>` primeiro para obter o rótulo do canal, o estado
da configuração, o resumo dos pré-requisitos e o link da documentação.

O Crestodian nunca altera o acesso de provedor/autenticação dentro da própria sessão: a
sessão já depende dessa rota de inferência. Para configurar ou reparar o provedor
do modelo, `configure model provider` retorna orientações para sair e executar a integração, sem
iniciar um assistente nem gravar a configuração. Saia do Crestodian e execute `openclaw
onboard`; a integração prepara as credenciais e salva somente uma rota que
conclua uma interação real em tempo real. Inicie o Crestodian novamente após a integração ser concluída com sucesso.

## Inicialização da configuração

`setup` configura o espaço de trabalho e o estado restante do Gateway depois que a integração guiada já estabeleceu a inferência. Ele grava somente por meio de operações tipadas de configuração e solicita aprovação primeiro.

```text
setup
setup workspace ~/Projects/work
```

`setup` preserva o modelo efetivo verificado. Ele não configura nem
substitui a inferência.

Se a inferência estiver ausente ou sua verificação em tempo real falhar, saia do Crestodian e execute `openclaw onboard`. A integração guiada detecta modelos configurados, chaves de API e CLIs locais autenticadas, solicita uma resposta real de cada candidato e persiste somente uma rota aprovada. O Crestodian inicia imediatamente após esse limite e pode então configurar o espaço de trabalho, o Gateway, canais, agentes, plugins e outros recursos opcionais.

O aplicativo para macOS ignora completamente essa sequência quando acessa um Gateway configurado
cujo agente padrão já tem um modelo configurado; ele abre a interface normal do
agente.
Para um Gateway novo ou incompleto, o aplicativo conduz a sequência de inferência pelos
métodos `crestodian.setup.detect` e `crestodian.setup.activate` do Gateway:
`detect` lista todos os backends candidatos encontrados, e `activate` testa um
candidato em tempo real (uma conclusão real de "responda com OK") e persiste somente o modelo,
a credencial e o estado do provedor/runtime necessários para essa rota depois que o teste é aprovado. Os padrões do espaço de trabalho e do Gateway permanecem sob responsabilidade do Crestodian. Um candidato com falha
nunca altera a configuração; o aplicativo percorre automaticamente a sequência e, por fim,
oferece uma etapa manual de chave/token preenchida com base nos plugins ativos de
provedores de inferência de texto do Gateway. O provedor selecionado é responsável por seu modelo
inicial e sua configuração, e a credencial é verificada da mesma maneira antes de ser salva.

A supervisão do Codex e outros recursos opcionais de plugins permanecem fora dessa
transação de ativação de inferência. Configure-os somente depois que a inferência estiver
funcionando e o Crestodian tiver iniciado; a política existente de plugins e as recusas
explícitas de supervisão permanecem inalteradas durante a configuração da inferência.

## Conversa com IA

A conversa livre do Crestodian interativo é executada pelo mesmo loop de agente que os agentes normais do OpenClaw, restrita a uma ferramenta de autoridade de nível zero do OpenClaw, `crestodian`, que encapsula as operações tipadas. Ações de leitura são executadas livremente, mutações exigem sua aprovação durante a conversa para aquela operação específica (consulte Operações e aprovação), e toda gravação aplicada é auditada e validada novamente. A sessão do agente persiste, portanto o Crestodian tem memória real entre várias interações. Se a rota de inferência verificada parar de funcionar posteriormente, volte para `openclaw onboard` e repare-a antes de continuar.

O host não converte solicitações em linguagem natural em operações. Mensagens livres
— incluindo textos que parecem comandos e perguntas como "por que meu
gateway parou?" — são enviadas à IA, que pode mapear a solicitação para uma operação tipada
por meio da ferramenta `crestodian`.

Quando uma mutação está pendente, somente expressões inequívocas de aprovação ou recusa de uma
lista fechada são resolvidas sem inferência. Consentimentos ambíguos são enviados para uma
chamada de conclusão configurada separadamente e, caso contrário, são recusados por padrão. Campos estruturados
do assistente e a navegação exata do host são controles da interface, não interpretação de operações
em linguagem natural. Uma exceção de higiene de segredos é especialmente importante: um
`config set` exato em um caminho confidencial (tokens, chaves, senhas) nunca chega
a um modelo. O host cria uma proposta censurada, e o valor é mascarado no
histórico visível à IA. Prefira `config set-ref <path> env <ENV_VAR>` para segredos.

O modo de recuperação por canais de mensagens nunca usa o planejador auxiliado pelo modelo. A recuperação remota permanece determinística para que um fluxo normal de agente quebrado ou comprometido não possa ser usado como editor de configuração.

### Modelo de confiança do ambiente de testes da CLI

Runtimes incorporados e o ambiente de testes do servidor de aplicativo do Codex impõem diretamente a
restrição de nível zero: a execução contém uma lista de ferramentas permitidas do OpenClaw com apenas
a ferramenta `crestodian`. Para o Codex, o OpenClaw também desativa ambientes, execução
nativa, múltiplos agentes, objetivo, aplicativo/plugin, skill/MCP, pesquisa na web e
as superfícies de `request_user_input` nessa execução. O Codex ainda injeta seu utilitário nativo inerte `update_plan`;
ele pode atualizar a lista de verificação temporária do modelo, mas não pode gravar arquivos
nem a configuração do OpenClaw. Ambientes de testes de CLI não consomem a lista de permissões do OpenClaw,
portanto o Crestodian aceita somente backends cujo próprio contrato de seleção de ferramentas possa comprovar
a mesma restrição:

- Backends selecionáveis, incluindo Claude Code, são iniciados com uma seleção
  vazia de ferramentas nativas e uma ferramenta MCP, `crestodian`. A configuração
  MCP gerada pelo Claude é aplicada com `--strict-mcp-config`, portanto nenhum
  outro servidor MCP é carregado.
- Backends que não declaram ferramentas nativas recebem o mesmo servidor MCP
  dedicado do Crestodian.
- Backends de ferramentas nativas sempre ativas ou desconhecidas falham de modo
  fechado antes da inferência; eles não podem hospedar uma sessão do Crestodian.

Somente as sessões do Crestodian recebem o servidor MCP crestodian; execuções
normais do agente nunca veem essa ferramenta. Portanto, backends de CLI
selecionáveis/sem ferramentas nativas e modelos com chave de API impõem o ciclo
literal de ferramenta única. Modelos do servidor de aplicativo do Codex impõem
uma única ferramenta de autoridade do OpenClaw, além do utilitário nativo inerte
de planejamento. Nos três casos, as gravações de configuração permanecem
restritas ao contrato auditado de aprovação do Crestodian.

A CLI do Gemini permanece disponível para agentes normais, mas não consegue
impor a sondagem sem ferramentas exigida pelo gate de inferência; portanto, não
pode hospedar o Crestodian.

## Alternar para um agente

Use um seletor em linguagem natural para sair do Crestodian e abrir a TUI normal:

```text
fale com o agente
fale com o agente de trabalho
altere para o agente principal
```

`openclaw tui`, `openclaw chat` e `openclaw terminal` abrem diretamente a TUI
normal do agente; eles não iniciam o Crestodian. Após alternar para a TUI normal,
`/crestodian` retorna ao Crestodian, opcionalmente com uma solicitação adicional:

```text
/crestodian
/crestodian reiniciar gateway
```

## Modo de recuperação por mensagens

O modo de recuperação por mensagens é o ponto de entrada do Crestodian nos
canais de mensagens: use-o quando seu agente normal estiver inativo, mas um
canal confiável (por exemplo, WhatsApp) ainda receber comandos.

Este é um manipulador determinístico de comandos de emergência, não o agente
conversacional Crestodian. Ele não inicializa uma nova configuração nem relaxa
o gate de inferência para o chat do Crestodian.

Comando compatível: `/crestodian <solicitação>`. A recuperação aceita somente a
gramática exata de comandos digitados — a linguagem natural é rejeitada com uma
dica, nunca é interpretada por suposição como uma operação e nenhum modelo é
consultado.

```text
Você, em uma DM confiável do proprietário: /crestodian status
OpenClaw: Modo de recuperação do Crestodian. Gateway acessível: não. Configuração válida: não.
Você: /crestodian restart gateway
OpenClaw: Plano: reiniciar o Gateway. Responda /crestodian yes para aplicar.
Você: /crestodian yes
OpenClaw: Aplicado. Entrada de auditoria gravada.
```

A criação de agentes também pode ser enfileirada localmente ou pela recuperação:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/crestodian create agent work workspace ~/Projects/work
```

A criação de agentes pode indicar somente o modelo padrão atual verificado em
tempo real. Omita o modelo para herdar essa rota.

A recuperação remota é uma superfície administrativa e deve ser tratada como
reparo remoto de configuração, não como chat normal.

Contrato de segurança da recuperação remota:

- Desativada quando o isolamento está ativo para o agente/sessão; o Crestodian
  recusa a recuperação remota e direciona para o reparo pela CLI local.
- O estado efetivo padrão é `auto`: permite a recuperação remota somente na
  operação YOLO confiável, em que o runtime já possui autoridade local sem
  isolamento (`tools.exec.security` é resolvido como `full` e `tools.exec.ask`
  como `off`, com o modo de isolamento definido como `off`).
- Exige uma identidade explícita de proprietário; não são permitidas regras de
  remetente curinga, políticas de grupo aberto, webhooks não autenticados nem
  canais anônimos.
- Por padrão, somente DMs do proprietário; a recuperação em grupos/canais exige
  adesão explícita.
- A pesquisa e a listagem de Plugins são somente leitura. A instalação de
  Plugins é sempre exclusivamente local (bloqueada na recuperação, mesmo quando
  habilitada de outra forma), pois baixa código executável. A desinstalação de
  Plugins é recusada tanto no Crestodian local quanto na recuperação; execute
  `openclaw plugins uninstall <id>` em um terminal.
- A recuperação remota não pode abrir a TUI local nem alternar para uma sessão
  interativa do agente; use o `openclaw` local para a transferência ao agente.
- Gravações persistentes ainda exigem aprovação, mesmo no modo de recuperação.
- Toda operação de recuperação aplicada é auditada. A recuperação por canal de
  mensagens registra metadados de canal, conta, remetente e endereço de origem;
  operações que alteram a configuração também registram os hashes da
  configuração antes e depois.
- Segredos nunca são exibidos. A inspeção de SecretRef informa a
  disponibilidade, não os valores.
- Se o Gateway estiver ativo, a recuperação dará preferência às operações
  tipadas do Gateway; se estiver inativo, usará somente a superfície mínima de
  reparo local que não dependa do ciclo normal do agente.

Formato da configuração:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled`: `"auto"` (padrão) permite a recuperação somente quando o runtime
  efetivo está em YOLO e o isolamento está desativado; `false` nunca permite a
  recuperação por canal de mensagens; `true` permite explicitamente a
  recuperação quando as verificações de proprietário/canal forem aprovadas
  (ainda sujeita à recusa decorrente do isolamento).
- `ownerDmOnly`: restringe a recuperação às mensagens diretas do proprietário.
  O padrão é `true`.
- `pendingTtlMinutes`: por quanto tempo uma gravação de recuperação pendente
  permanece aberta para aprovação com `/crestodian yes` antes de expirar. O
  padrão é `15`.

A recuperação remota é coberta pela etapa do Docker:

```bash
pnpm test:docker:crestodian-rescue
```

Um teste rápido opcional da superfície de comandos do canal em ambiente real
verifica `/crestodian status` e um ciclo persistente de aprovação pelo
manipulador de recuperação:

```bash
pnpm test:live:crestodian-rescue-channel
```

A configuração única empacotada com gate de inferência é coberta por:

```bash
pnpm test:docker:crestodian-first-run
```

Essa etapa da CLI empacotada começa com um diretório de estado vazio e comprova
que o Crestodian falha de modo fechado sem inferência. Em seguida, ela testa e
ativa um Claude simulado por meio do módulo de ativação empacotado. Somente
depois disso uma solicitação imprecisa chega ao planejador e é resolvida como
uma configuração tipada, seguida por comandos de execução única que criam um
agente adicional, configuram o Discord por meio da habilitação de um Plugin e
de uma SecretRef de token, validam a configuração e verificam o log de
auditoria. Essa etapa fornece evidências complementares do gate e das operações;
ela não exercita a integração interativa nem a conversa de
agente/ferramenta/aprovação do Crestodian. O cenário do QA Lab abaixo redireciona
para a mesma etapa do Docker:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Doctor](/pt-BR/cli/doctor)
- [TUI](/pt-BR/cli/tui)
- [Isolamento](/pt-BR/cli/sandbox)
- [Segurança](/pt-BR/cli/security)
