---
read_when:
    - Você concluiu a configuração de inferência e quer que o Crestodian configure o restante
    - Você precisa inspecionar ou reparar o OpenClaw com o agente de configuração local
    - Você está projetando ou habilitando o modo de recuperação do canal de mensagens
summary: Referência da CLI e modelo de segurança do auxiliar de configuração e reparo do Crestodian baseado em inferência
title: Crestodiano
x-i18n:
    generated_at: "2026-07-12T15:04:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: af4861a48fb26159cb8e0c29d08ab5c3776283eb5392dcbe08c9a28d01f4abf5
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

O Crestodian Conversacional é o agente local de configuração inicial, reparo e configuração
do OpenClaw. Ele só é iniciado depois que o modelo padrão efetivo conclui uma interação real.
Instalações novas estabelecem a inferência primeiro; configurações malformadas permanecem no
fluxo clássico do doctor.

## Quando ele é iniciado

Executar `openclaw` sem um subcomando direciona o fluxo com base no estado da configuração:

- Configuração ausente ou existente sem definições criadas pelo usuário (vazia ou contendo apenas as chaves `$schema`/`meta`): inicia a integração guiada com verificação de IA em tempo real.
- A configuração existe, mas não passa na validação: inicia a integração clássica, que relata os problemas e orienta você a usar `openclaw doctor`.
- A configuração existe e é válida: abre a TUI normal do agente. Um Gateway configurado e acessível cujo agente padrão tenha um modelo abre diretamente essa interface
  sem integração nem Crestodian. Use `/crestodian` dentro da TUI ou execute
  `openclaw crestodian` diretamente para acessar o Crestodian mais tarde.

Executar `openclaw crestodian` primeiro testa em tempo real o modelo padrão configurado. Uma interação bem-sucedida inicia o Crestodian. Uma falha interativa abre a configuração guiada de inferência e transfere o controle para o Crestodian depois que um candidato é aprovado. Solicitações únicas, JSON e outras solicitações não interativas falham com instruções para executar `openclaw onboard` quando a inferência não está disponível. `openclaw --help` e `openclaw --version` mantêm seus fluxos rápidos normais.

A execução não interativa de `openclaw` sem subcomando (sem TTY) termina com uma mensagem curta em vez de exibir a ajuda raiz: ela indica a integração não interativa em uma instalação nova ou inválida, ou `openclaw agent --local ...` quando a configuração é válida.

`openclaw onboard --modern` continua sendo um alias de compatibilidade para o Crestodian, mas usa o mesmo controle de inferência: uma inferência funcional abre o chat, falhas interativas iniciam a configuração guiada de inferência e falhas não interativas encerram o processo com orientações de integração. `openclaw onboard --classic` abre o assistente completo passo a passo.

## O que o Crestodian mostra

O Crestodian interativo abre o mesmo shell da TUI que `openclaw tui`, com um backend de chat do Crestodian. A saudação inicial aborda:

- a validade da configuração e o agente padrão
- o modelo verificado que o Crestodian está usando
- a acessibilidade do Gateway na primeira verificação de inicialização
- a próxima ação de depuração recomendada

Ele não exibe secrets nem carrega comandos de CLI de plugins apenas para iniciar.

Use `status` para consultar o inventário detalhado: caminho da configuração, caminhos da documentação e do código-fonte, verificações locais da CLI, presença de chaves/tokens, agentes, modelo e detalhes do Gateway.

O Crestodian usa a mesma descoberta de referências que os agentes comuns: em um checkout do Git, ele aponta para a pasta local `docs/` e a árvore do código-fonte; em uma instalação npm, ele usa a documentação incluída e fornece um link para [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), com a orientação de consultar o código-fonte quando a documentação não for suficiente.

## Exemplos

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "modelos"
openclaw crestodian --message "validar configuração"
openclaw crestodian --message "configurar espaço de trabalho ~/Projects/work" --yes
openclaw crestodian --message "definir modelo padrão como openai/gpt-5.6" --yes
openclaw onboard --modern
```

Dentro da TUI do Crestodian:

```text
status
health
doctor
validar configuração
configurar
configurar espaço de trabalho ~/Projects/work
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
status do gateway
reiniciar gateway
agentes
criar agente work com espaço de trabalho ~/Projects/work
modelos
configurar provedor de modelo
definir modelo padrão como openai/gpt-5.6
canais
informações do canal slack
conectar slack
abrir assistente de canal para slack
listar plugins
pesquisar plugins slack
plugin install clawhub:openclaw-codex-app-server
conversar com o agente work
conversar com o agente de ~/Projects/work
auditoria
sair
```

## Operações e aprovação

O Crestodian usa operações tipadas em vez de editar a configuração de forma ad hoc.

As operações somente leitura são executadas imediatamente: mostrar visão geral, listar agentes, listar plugins instalados, pesquisar plugins no ClawHub, mostrar o status do modelo/backend, executar verificações de status/health, verificar a acessibilidade do Gateway, executar doctor sem correções interativas, validar a configuração e mostrar o caminho do log de auditoria.

O início da configuração guiada de um canal (`connect telegram`) também é executado imediatamente. O assistente coleta respostas explícitas e controla as gravações resultantes.

Operações persistentes exigem aprovação durante a conversa (ou `--yes` para um comando direto): gravar a configuração, `config set`, `config set-ref`, inicialização da configuração/integração, alterar o modelo padrão, iniciar/parar/reiniciar o Gateway, criar agentes e instalar plugins.

Os reparos do doctor não estão disponíveis no Crestodian porque podem reescrever o provedor, a autenticação ou a rota de inferência do agente padrão que mantém a sessão. Saia do Crestodian e execute `openclaw doctor --fix` em um terminal. O comando somente leitura `doctor` continua disponível no Crestodian.

Novos agentes herdam a rota de inferência padrão verificada em tempo real. O id de agente `crestodian` é reservado para o custodiante virtual privilegiado e não pode ser criado como um agente normal.

`config set` e `config set-ref` não podem alterar o estado da rota de inferência,
incluindo credenciais do provedor de inferência, `auth.*` de nível superior, catálogos de modelos,
backends de CLI, rotas de modelo padrão/por agente, parâmetros/ferramentas do agente ou
`tools.*` raiz. Gravações brutas em `env.*`, `secrets.*`, `plugins.*` e `$include`
também são recusadas porque podem substituir a resolução de credenciais ou a ativação
do provedor. A autenticação do Gateway e dos canais permanece como superfícies normais de configuração. Use fluxos tipados de plugins/canais e
`set default model <provider/model>` para uma rota já
configurada; o comando testa a rota em tempo real antes de salvá-la. Para configurar ou
reparar o acesso ao provedor/autenticação, saia do Crestodian e execute `openclaw onboard`.

A desinstalação de plugins é recusada dentro do Crestodian porque remover um
plugin de provedor poderia desativar a rota de inferência que alimenta a sessão. Saia do Crestodian
e execute `openclaw plugins uninstall <id>` em um terminal.

A aprovação é dada com suas próprias palavras: respostas inequívocas ("sim", "claro", "pode prosseguir", "agora não") são resolvidas com base em uma lista determinística fechada. Quando a rota configurada oferece suporte a uma chamada de conclusão separada, outras respostas podem ser classificadas usando apenas sua mensagem e a proposta pendente — nunca pelo próprio modelo de conversa, que não pode se autoaprovar. Respostas não classificadas ou ambíguas mantêm a proposta pendente, e a conversa pergunta novamente.

As gravações aplicadas são registradas em `~/.openclaw/audit/crestodian.jsonl`. A descoberta não é auditada; somente operações e gravações aplicadas são.

A configuração de canais pode ser executada como uma conversa hospedada até chegar a um segredo. A
TUI local do Crestodian não aceita respostas confidenciais do assistente de configuração porque a entrada
de chat do terminal fica visível. Ela oferece `open channel wizard` imediatamente, levando
o canal selecionado para o assistente de terminal com entrada mascarada; você também pode executar
`openclaw channels add --channel <channel>` posteriormente.

### Alternando para a configuração mascarada de canais

O chat local pode transferir o controle para o assistente mascarado de canais:

```text
open channel wizard for slack
channel info slack
```

`open channel wizard for <channel>` abre a configuração mascarada do canal depois que a
TUI de chat é fechada. Use `channel info <channel>` primeiro para obter o nome de exibição do canal, o estado
da configuração, o resumo dos pré-requisitos e o link da documentação.

O Crestodian nunca altera o acesso ao provedor/autenticação de dentro da própria sessão: a
sessão já depende dessa rota de inferência. Para configurar ou
reparar o provedor do modelo, `configure model provider` retorna orientações para sair e executar o onboarding sem
iniciar um assistente ou gravar a configuração. Saia do Crestodian e execute `openclaw
onboard`; o onboarding prepara as credenciais e salva somente uma rota que
conclui uma interação real em tempo real. Inicie o Crestodian novamente depois que o onboarding for concluído com sucesso.

## Inicialização da configuração

`setup` configura o espaço de trabalho restante e o estado do Gateway depois que o onboarding guiado já estabeleceu a inferência. Ele grava somente por meio de operações tipadas de configuração e solicita aprovação primeiro.

```text
setup
setup workspace ~/Projects/work
```

`setup` preserva o modelo efetivo verificado. Ele não configura nem
substitui a inferência.

Se a inferência estiver ausente ou sua verificação em tempo real falhar, saia do Crestodian e execute `openclaw onboard`. O onboarding guiado detecta modelos configurados, chaves de API e CLIs locais autenticadas, solicita uma resposta real a cada candidato e persiste somente uma rota aprovada. O Crestodian inicia imediatamente após esse limite e pode então configurar o espaço de trabalho, o Gateway, os canais, os agentes, os plugins e outros recursos opcionais.

O aplicativo para macOS ignora completamente essa sequência quando encontra um Gateway configurado
cujo agente padrão já tem um modelo configurado; ele abre a interface normal do agente.
Para um Gateway novo ou incompleto, o aplicativo conduz a sequência de inferência por meio
dos métodos do Gateway `crestodian.setup.detect` e `crestodian.setup.activate`:
detect lista todos os backends candidatos encontrados, activate testa em tempo real um
candidato (uma conclusão real de "responda com OK") e persiste somente o modelo,
a credencial e o estado do provedor/runtime necessários para essa rota depois que o teste é aprovado. Os padrões do espaço de trabalho e do Gateway permanecem para o Crestodian. Um candidato com falha
nunca altera a configuração; o aplicativo percorre automaticamente a sequência e, por fim,
oferece uma etapa manual de chave/token preenchida com base nos plugins de provedor de
inferência de texto ativos do Gateway. O provedor selecionado é responsável por seu modelo
inicial e sua configuração, e a credencial é verificada da mesma forma antes de ser salva.

A supervisão do Codex e outros recursos opcionais de plugins permanecem fora dessa
transação de ativação de inferência. Configure-os somente depois que a inferência estiver
funcionando e o Crestodian tiver iniciado; a política existente de plugins e as
desativações explícitas de supervisão permanecem inalteradas durante a configuração da inferência.

## Conversa com IA

A conversa livre do Crestodian interativo é executada pelo mesmo loop de agente dos agentes comuns do OpenClaw, restrita a uma única ferramenta de autoridade de nível zero do OpenClaw, `crestodian`, que encapsula as operações tipadas. As ações de leitura são executadas livremente, as mutações exigem sua aprovação conversacional para aquela operação exata (consulte Operações e aprovação), e cada gravação aplicada é auditada e revalidada. A sessão do agente persiste, portanto o Crestodian tem memória real de múltiplos turnos. Se a rota de inferência verificada parar de funcionar posteriormente, retorne a `openclaw onboard` e repare-a antes de continuar.

O host não analisa solicitações em linguagem natural para convertê-las em operações. Mensagens livres
— incluindo textos semelhantes a comandos e perguntas como "por que meu
gateway parou?" — são enviadas à IA, que pode mapear a solicitação para uma operação tipada
por meio da ferramenta `crestodian`.

Quando uma mutação está pendente, somente frases inequívocas de aprovação ou recusa de uma
lista fechada são resolvidas sem inferência. Consentimentos ambíguos são enviados a uma
chamada de conclusão configurada separadamente e, caso contrário, são recusados por segurança. Campos estruturados
do assistente e a navegação exata do host são controles da interface, não análise de operações
em linguagem natural. Uma exceção de higiene de segredos é especialmente importante: um
`config set` exato em um caminho confidencial (tokens, chaves, senhas) nunca chega
a um modelo. O host cria uma proposta com dados ocultados, e o valor é mascarado no
histórico visível para a IA. Prefira `config set-ref <path> env <ENV_VAR>` para segredos.

O modo de recuperação por canal de mensagens nunca usa o planejador assistido por modelo. A recuperação remota permanece determinística para que um caminho de agente normal quebrado ou comprometido não possa ser usado como editor de configuração.

### Modelo de confiança do harness de CLI

Os runtimes incorporados e o harness do servidor de aplicativo do Codex impõem diretamente a
restrição de nível zero: a execução contém uma lista de ferramentas permitidas do OpenClaw somente com
a ferramenta `crestodian`. Para o Codex, o OpenClaw também desativa ambientes, execução
nativa, múltiplos agentes, objetivo, aplicativo/plugin, skill/MCP, pesquisa na web e
as superfícies de `request_user_input` para essa execução. O Codex ainda injeta seu utilitário nativo inerte `update_plan`;
ele pode atualizar a lista de verificação temporária do modelo, mas não pode gravar arquivos
nem a configuração do OpenClaw. Os harnesses de CLI não consomem a lista de permissões do OpenClaw,
portanto o Crestodian admite somente backends cujo próprio contrato de seleção de ferramentas possa comprovar
a mesma restrição:

- Backends selecionáveis, incluindo Claude Code, são iniciados com uma seleção
  vazia de ferramentas nativas e uma ferramenta MCP, `crestodian`. A configuração
  MCP gerada pelo Claude é aplicada com `--strict-mcp-config`, portanto nenhum
  outro servidor MCP é carregado.
- Backends que não declaram ferramentas nativas recebem o mesmo servidor MCP
  dedicado do Crestodian.
- Backends com ferramentas nativas sempre ativas ou desconhecidas falham de
  forma fechada antes da inferência; eles não podem hospedar uma sessão do
  Crestodian.

Somente as sessões do Crestodian recebem o servidor MCP crestodian; as execuções
normais do agente nunca veem essa ferramenta. Portanto, backends de CLI
selecionáveis/sem ferramentas nativas e modelos com chave de API impõem o ciclo
literal de uma única ferramenta. Os modelos do app-server do Codex impõem uma
única ferramenta de autoridade do OpenClaw mais o utilitário nativo inerte de
planejamento. Nos três casos, as gravações de configuração permanecem restritas
ao contrato de aprovação auditado do Crestodian.

A Gemini CLI continua disponível para agentes normais, mas não pode impor a
sondagem sem ferramentas exigida pelo gate de inferência, portanto não pode
hospedar o Crestodian.

## Alternar para um agente

Use um seletor em linguagem natural para sair do Crestodian e abrir a TUI normal:

```text
falar com o agente
falar com o agente de trabalho
alternar para o agente principal
```

`openclaw tui`, `openclaw chat` e `openclaw terminal` abrem diretamente a TUI do agente normal; eles não iniciam o Crestodian. Depois de alternar para a TUI normal, `/crestodian` retorna ao Crestodian, opcionalmente com uma solicitação complementar:

```text
/crestodian
/crestodian reiniciar gateway
```

## Modo de resgate de mensagens

O modo de resgate de mensagens é o ponto de entrada por canal de mensagens do Crestodian: use-o quando seu agente normal estiver inoperante, mas um canal confiável (por exemplo, WhatsApp) ainda receber comandos.

Este é um manipulador determinístico de comandos de emergência, não o agente
conversacional Crestodian. Ele não inicializa uma nova configuração nem flexibiliza o
bloqueio de inferência para o chat do Crestodian.

Comando compatível: `/crestodian <request>`. O resgate aceita somente a gramática exata do comando digitado — linguagem natural é rejeitada com uma dica, nunca interpretada como uma operação, e nenhum modelo é consultado.

```text
Você, em uma DM confiável do proprietário: /crestodian status
OpenClaw: Modo de resgate do Crestodian. Gateway acessível: não. Configuração válida: não.
Você: /crestodian restart gateway
OpenClaw: Plano: reiniciar o Gateway. Responda /crestodian yes para aplicar.
Você: /crestodian yes
OpenClaw: Aplicado. Entrada de auditoria registrada.
```

A criação de agentes também pode ser enfileirada localmente ou por meio do resgate:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/crestodian create agent work workspace ~/Projects/work
```

A criação de agentes pode especificar somente o modelo padrão atual verificado em tempo real. Omita o
modelo para herdar essa rota.

O resgate remoto é uma superfície administrativa e deve ser tratado como reparo remoto de configuração, não como chat normal.

Contrato de segurança para resgate remoto:

- Desativado quando o isolamento está ativo para o agente/sessão; o Crestodian recusa o resgate remoto e orienta a usar o reparo pela CLI local.
- O estado efetivo padrão é `auto`: permite o resgate remoto somente em operação YOLO confiável, na qual o runtime já possui autoridade local sem isolamento (`tools.exec.security` é resolvido como `full` e `tools.exec.ask` como `off`, com o modo de isolamento `off`).
- Exige uma identidade explícita do proprietário; não são permitidas regras de remetente curinga, políticas de grupo abertas, webhooks não autenticados nem canais anônimos.
- Por padrão, somente mensagens diretas do proprietário; o resgate em grupo/canal exige adesão explícita.
- A pesquisa e a listagem de plugins são somente leitura. A instalação de plugins é sempre exclusivamente local (bloqueada no resgate, mesmo quando habilitada em outros contextos), pois baixa código executável. A desinstalação de plugins é recusada tanto no Crestodian local quanto no resgate; execute `openclaw plugins uninstall <id>` em um terminal.
- O resgate remoto não pode abrir a TUI local nem mudar para uma sessão interativa de agente; use o `openclaw` local para transferir ao agente.
- Gravações persistentes ainda exigem aprovação, mesmo no modo de resgate.
- Cada operação de resgate aplicada é auditada. O resgate por canal de mensagens registra metadados de canal, conta, remetente e endereço de origem; operações que alteram a configuração também registram os hashes da configuração antes e depois.
- Segredos nunca são exibidos. A inspeção de SecretRef informa a disponibilidade, não os valores.
- Se o Gateway estiver ativo, o resgate dará preferência às operações tipadas do Gateway; se estiver inativo, o resgate usará somente a superfície mínima de reparo local que não depende do loop normal do agente.

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

- `enabled`: `"auto"` (padrão) permite o resgate somente quando o runtime efetivo está em modo YOLO e o isolamento está desativado; `false` nunca permite o resgate por canal de mensagens; `true` permite explicitamente o resgate quando as verificações de proprietário/canal são aprovadas (ainda sujeito à recusa por isolamento).
- `ownerDmOnly`: restringe o resgate às mensagens diretas do proprietário. Padrão: `true`.
- `pendingTtlMinutes`: por quanto tempo uma gravação de resgate pendente permanece aberta para aprovação com `/crestodian yes` antes de expirar. Padrão: `15`.

O resgate remoto é coberto pela sequência do Docker:

```bash
pnpm test:docker:crestodian-rescue
```

Um teste rápido opcional da superfície de comandos do canal em ambiente real verifica `/crestodian status`, além de um ciclo completo de aprovação persistente pelo manipulador de resgate:

```bash
pnpm test:live:crestodian-rescue-channel
```

A configuração única empacotada, condicionada à inferência, é coberta por:

```bash
pnpm test:docker:crestodian-first-run
```

Essa sequência da CLI empacotada começa com um diretório de estado vazio e comprova que o Crestodian
falha de forma segura sem inferência. Em seguida, ela testa e ativa um Claude falso por meio
do módulo de ativação empacotado. Somente depois disso uma solicitação imprecisa chega ao
planejador e é resolvida como uma configuração tipada, seguida por comandos de execução única que criam um
agente adicional, configuram o Discord por meio da habilitação de um plugin mais um
SecretRef de token, validam a configuração e verificam o log de auditoria. Essa sequência fornece
evidências complementares de barreira/operação; ela não exercita a integração interativa nem a
conversa de agente/ferramenta/aprovação do Crestodian. O cenário do QA Lab abaixo redireciona
para a mesma sequência do Docker:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Doctor](/pt-BR/cli/doctor)
- [TUI](/pt-BR/cli/tui)
- [Isolamento](/pt-BR/cli/sandbox)
- [Segurança](/pt-BR/cli/security)
