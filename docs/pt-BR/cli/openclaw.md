---
read_when:
    - Você concluiu a configuração da inferência e quer que o OpenClaw configure o restante
    - É necessário inspecionar ou reparar o OpenClaw com o agente de configuração local
    - Você está projetando ou habilitando o modo de recuperação do canal de mensagens
summary: Referência da CLI e modelo de segurança do assistente de configuração e reparo do OpenClaw baseado em inferência
title: Agente de configuração do OpenClaw
x-i18n:
    generated_at: "2026-07-16T12:22:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cf52eeaf14dd2e2bc388c69a1566d4956d42d27cd28cd74b3f1fbee5a2b2e5f
    source_path: cli/openclaw.md
    workflow: 16
---

# `openclaw setup`

O OpenClaw é fornecido com um agente de sistema integrado — ele se apresenta como "OpenClaw" — para
configuração local, reparo e ajustes (anteriormente chamado de Crestodian). Ele só é iniciado depois que o modelo padrão efetivo conclui uma interação real.
Instalações novas estabelecem a inferência primeiro; configurações malformadas permanecem no
fluxo clássico do doctor.

## Quando ele é iniciado

A execução de `openclaw` sem subcomando é direcionada com base no estado da configuração:

- Configuração ausente ou existente sem ajustes definidos pelo usuário (vazia ou contendo apenas as chaves `$schema`/`meta`): inicia a integração guiada com verificação de IA em tempo real.
- A configuração existe, mas não passa na validação: inicia a integração clássica, que relata os problemas e orienta a usar `openclaw doctor`.
- A configuração existe e é válida: abre a TUI normal do agente. Um Gateway configurado e acessível cujo agente padrão tenha um modelo acessa diretamente essa interface
  sem integração nem OpenClaw. Use `/openclaw` dentro da TUI ou execute
  `openclaw setup` diretamente para acessar o OpenClaw depois.

A execução de `openclaw setup` primeiro testa em tempo real o modelo padrão configurado. Uma interação bem-sucedida inicia o OpenClaw. Uma falha interativa abre a configuração guiada de inferência e transfere o controle ao OpenClaw depois que um candidato é aprovado. Solicitações pontuais, em JSON e outras não interativas falham com instruções para executar `openclaw onboard` quando a inferência não está disponível. `openclaw --help` e `openclaw --version` mantêm seus fluxos rápidos normais.

A execução não interativa de `openclaw` sem argumentos (sem TTY) é encerrada com uma mensagem curta, em vez de exibir a ajuda raiz: ela orienta para a integração não interativa em uma instalação nova ou inválida, ou para `openclaw agent --local ...` quando a configuração é válida.

`openclaw onboard --modern` continua sendo um alias de compatibilidade do OpenClaw, mas usa a mesma barreira de inferência: uma inferência funcional abre o chat, falhas interativas iniciam a configuração guiada de inferência e falhas não interativas são encerradas com orientações de integração. `openclaw onboard --classic` abre o assistente completo passo a passo.

## O que o OpenClaw mostra

O OpenClaw interativo abre o mesmo shell de TUI que `openclaw tui`, com um backend de chat do OpenClaw. A saudação inicial abrange:

- a validade da configuração e o agente padrão
- o modelo verificado que o OpenClaw está usando
- a acessibilidade do Gateway segundo a primeira sondagem de inicialização
- a próxima ação recomendada de depuração

Ele não exibe segredos nem carrega comandos de CLI de plugins apenas para iniciar.

Use `status` para ver o inventário detalhado: caminho da configuração, caminhos da documentação e do código-fonte, sondagens da CLI local, presença de chaves/tokens, agentes, modelo e detalhes do Gateway.

O OpenClaw usa a mesma descoberta de referências que os agentes comuns: em um checkout do Git, ele aponta para `docs/` local e para a árvore de código-fonte; em uma instalação npm, ele usa a documentação incluída e fornece um link para [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), com a orientação de consultar o código-fonte quando a documentação não for suficiente.

## Exemplos

```bash
openclaw
openclaw setup
openclaw setup --json
openclaw setup --message "models"
openclaw setup --message "validate config"
openclaw setup --message "setup workspace ~/Projects/work" --yes
openclaw setup --message "set default model openai/gpt-5.6" --yes
openclaw onboard --modern
```

Dentro da TUI do OpenClaw:

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

O OpenClaw usa operações tipadas em vez de editar a configuração de maneira ad hoc.

As operações somente leitura são executadas imediatamente: mostrar a visão geral, listar agentes, listar plugins instalados, pesquisar plugins do ClawHub, mostrar o status do modelo/backend, executar verificações de status/integridade, verificar a acessibilidade do Gateway, executar o doctor sem correções interativas, validar a configuração e mostrar o caminho do log de auditoria.

O início da configuração guiada de canal (`connect telegram`) também é executado imediatamente. Seu assistente coleta respostas explícitas e controla as gravações resultantes.

As operações persistentes exigem aprovação durante a conversa (ou `--yes` para um comando direto): gravar a configuração, `config set`, `config set-ref`, inicialização da configuração/integração, alterar o modelo padrão, iniciar/parar/reiniciar o Gateway, criar agentes e instalar plugins.

Os reparos do doctor não estão disponíveis dentro do OpenClaw porque podem regravar o provedor, a autenticação ou a rota de inferência do agente padrão que mantém a sessão. Saia do OpenClaw e execute `openclaw doctor --fix` em um terminal. O `doctor` somente leitura continua disponível dentro do OpenClaw.

Novos agentes herdam a rota padrão de inferência verificada em tempo real. Os IDs de agente `openclaw` e `crestodian` são reservados ao agente de sistema e não podem ser criados como agentes comuns. O ID desativado continua bloqueado para impedir que uma configuração antiga o reivindique.

`config set` e `config set-ref` não podem alterar o estado da rota de inferência,
incluindo credenciais do provedor de inferência, `auth.*` de nível superior, catálogos de modelos,
backends de CLI, rotas de modelo padrão/por agente, parâmetros/ferramentas do agente ou
`tools.*` raiz. Gravações diretas em `env.*`, `secrets.*`, `plugins.*` e `$include`
também são recusadas porque podem substituir a resolução de credenciais ou a
ativação do provedor. A autenticação do Gateway e dos canais continua sendo uma superfície normal de configuração. Use os fluxos tipados de plugin/canal e
`set default model <provider/model>` para uma rota já
configurada; ele testa a rota em tempo real antes de salvá-la. Para configurar ou
reparar o acesso ao provedor/à autenticação, saia do OpenClaw e execute `openclaw onboard`.

A desinstalação de plugins é recusada dentro do OpenClaw porque a remoção de um plugin de
provedor poderia desativar a rota de inferência que mantém a sessão. Saia do OpenClaw
e execute `openclaw plugins uninstall <id>` em um terminal.

A aprovação é expressa com suas próprias palavras: respostas inequívocas ("sim", "claro", "pode prosseguir", "agora não") são resolvidas com base em uma lista determinística fechada. Quando a rota configurada oferece suporte a uma chamada de conclusão separada, outras respostas podem ser classificadas usando apenas sua mensagem e a proposta pendente — nunca pelo próprio modelo de conversa, que não pode se autoaprovar. Respostas não classificadas ou ambíguas mantêm a proposta pendente, e a conversa pergunta novamente.

As gravações aplicadas são registradas em `~/.openclaw/audit/system-agent.jsonl`. A descoberta não é auditada; somente operações e gravações aplicadas são.

A configuração do canal pode ocorrer como uma conversa hospedada até chegar a um segredo. A
TUI local do OpenClaw não aceita respostas confidenciais do assistente porque a entrada
do chat no terminal fica visível. Ela oferece `open channel wizard` imediatamente, levando
o canal selecionado para o assistente mascarado do terminal; também é possível executar
`openclaw channels add --channel <channel>` posteriormente.

### Como alternar para a configuração mascarada do canal

O chat local pode transferir o controle para o assistente mascarado do canal:

```text
open channel wizard for slack
channel info slack
```

`open channel wizard for <channel>` abre a configuração mascarada do canal depois que a
TUI de chat é fechada. Use `channel info <channel>` primeiro para ver o rótulo do canal, o estado da
configuração, o resumo dos pré-requisitos e o link da documentação.

O OpenClaw nunca altera o acesso ao provedor/à autenticação dentro da própria sessão: a
sessão já depende dessa rota de inferência. Para configurar ou
reparar o provedor de modelos, `configure model provider` retorna orientações para sair e iniciar a integração sem
iniciar um assistente nem gravar a configuração. Saia do OpenClaw e execute `openclaw
onboard`; a integração prepara as credenciais e salva somente uma rota que
conclua uma interação real em tempo real. Inicie o OpenClaw novamente depois que a integração for concluída com sucesso.

## Inicialização da configuração

`setup` configura o espaço de trabalho restante e o estado do Gateway depois que a integração guiada já estabeleceu a inferência. Ele grava somente por meio de operações de configuração tipadas e solicita aprovação primeiro.

```text
setup
setup workspace ~/Projects/work
```

`setup` preserva o modelo efetivo verificado. Ele não configura nem
substitui a inferência.

Se a inferência estiver ausente ou sua verificação em tempo real falhar, saia do OpenClaw e execute `openclaw onboard`. A integração guiada detecta modelos configurados, chaves de API e CLIs locais autenticadas, solicita uma resposta real de cada candidato e persiste somente uma rota aprovada. O OpenClaw é iniciado imediatamente depois desse limite e pode então configurar o espaço de trabalho, o Gateway, os canais, os agentes, os plugins e outros recursos opcionais.

O aplicativo para macOS ignora completamente essa sequência quando alcança um Gateway configurado
cujo agente padrão já possui um modelo configurado; ele abre a interface normal do
agente.
Para um Gateway novo ou incompleto, o aplicativo conduz a sequência de inferência pelos
métodos do Gateway `openclaw.setup.detect` e `openclaw.setup.activate`:
a detecção lista todos os backends candidatos encontrados; a ativação testa em tempo real um
candidato (uma conclusão real com "reply with OK") e só persiste o modelo,
a credencial e o estado do provedor/runtime necessários para essa rota depois que o teste é aprovado. Os padrões do espaço de trabalho e do Gateway ficam a cargo do OpenClaw. Um candidato com falha
nunca altera a configuração; o aplicativo percorre automaticamente a sequência e, por fim,
oferece uma etapa manual de chave/token preenchida com base nos plugins de provedor de
inferência de texto ativos no Gateway. O provedor selecionado controla seu modelo
inicial e sua configuração, e a credencial é verificada da mesma forma antes de ser salva.

A supervisão do Codex e outros recursos opcionais de plugins permanecem fora dessa
transação de ativação da inferência. Configure-os somente depois que a inferência estiver
funcionando e o OpenClaw tiver sido iniciado; a política existente de plugins e as recusas explícitas
de supervisão permanecem inalteradas durante a configuração da inferência.

## Conversa com IA

A conversa livre do OpenClaw interativo é executada pelo mesmo loop de agente que os agentes comuns do OpenClaw, restrita a uma única ferramenta de autoridade de nível zero do OpenClaw, `openclaw`, que encapsula as operações tipadas. As ações de leitura são executadas livremente, as mutações exigem sua aprovação durante a conversa para essa operação exata (consulte Operações e aprovação), e cada gravação aplicada é auditada e validada novamente. A sessão do agente persiste, portanto o OpenClaw tem memória real de múltiplas interações. Se a rota de inferência verificada deixar de funcionar posteriormente, retorne a `openclaw onboard` e repare-a antes de continuar.

O host não analisa solicitações em linguagem natural para convertê-las em operações. Mensagens livres
— incluindo textos que se parecem com comandos e perguntas como "por que meu
gateway parou?" — são enviadas à IA, que pode mapear a solicitação para uma operação tipada
por meio da ferramenta `openclaw`.

Quando uma mutação está pendente, somente frases inequívocas de aprovação ou recusa de uma
lista fechada são resolvidas sem inferência. Uma autorização ambígua é enviada a uma
chamada de conclusão configurada separadamente e, caso contrário, falha de forma segura. Campos
estruturados do assistente e a navegação exata do host são controles da interface, não análise de
operações em linguagem natural. Uma exceção de higiene de segredos é especialmente importante: um
`config set` exato em um caminho confidencial (tokens, chaves, senhas) nunca chega
a um modelo. O host cria uma proposta com informações ocultadas, e o valor é mascarado no
histórico visível à IA. Prefira `config set-ref <path> env <ENV_VAR>` para segredos.

O modo de recuperação por canal de mensagens nunca usa o planejador assistido pelo modelo. A recuperação remota permanece determinística para que um caminho normal de agente danificado ou comprometido não possa ser usado como editor de configuração.

### Modelo de confiança do harness de CLI

Os runtimes incorporados e o harness do app-server do Codex impõem diretamente
a restrição de nível zero: a execução carrega uma lista de permissões de ferramentas do OpenClaw contendo apenas
a ferramenta `openclaw`. Para o Codex, o OpenClaw também desabilita ambientes, execução
nativa, multiagente, objetivo, app/plugin, skill/MCP, pesquisa na web e
as superfícies `request_user_input` nessa execução. O Codex ainda injeta seu utilitário nativo inerte `update_plan`;
ele pode atualizar a lista de verificação temporária do modelo, mas não pode gravar arquivos
nem a configuração do OpenClaw. Os harnesses de CLI não consomem a lista de permissões do OpenClaw,
portanto, o OpenClaw admite apenas backends cujo próprio contrato de seleção de ferramentas possa comprovar
a mesma restrição:

- Backends selecionáveis, incluindo o Claude Code, são iniciados com uma seleção vazia de ferramentas
  nativas e uma ferramenta MCP, `openclaw`. A configuração MCP gerada pelo Claude é
  aplicada com `--strict-mcp-config`, portanto, nenhum outro servidor MCP é carregado.
- Backends que declaram não ter ferramentas nativas recebem o mesmo servidor MCP
  dedicado do OpenClaw.
- Backends com ferramentas nativas sempre ativas ou desconhecidas falham de forma fechada antes da inferência;
  eles não podem hospedar uma sessão do OpenClaw.

Apenas as sessões do OpenClaw recebem o servidor MCP openclaw; execuções normais do agente
nunca veem essa ferramenta. Portanto, backends de CLI selecionáveis/sem ferramentas nativas e modelos com chave de API
impõem o loop literal de ferramenta única. Os modelos do app-server do Codex impõem
uma única ferramenta de autoridade do OpenClaw, além do utilitário nativo inerte de planejamento. Em todos
os três casos, as gravações de configuração permanecem restritas ao contrato auditado de aprovação
do OpenClaw.

A CLI do Gemini continua disponível para agentes normais, mas não consegue impor a
sondagem sem ferramentas exigida pelo gate de inferência, portanto, não pode hospedar o OpenClaw.

## Como alternar para um agente

Use um seletor em linguagem natural para sair do OpenClaw e abrir a TUI normal:

```text
falar com o agente
falar com o agente de trabalho
alternar para o agente principal
```

`openclaw tui`, `openclaw chat` e `openclaw terminal` abrem diretamente a TUI normal do agente; eles não iniciam o OpenClaw. Após alternar para a TUI normal, `/openclaw` retorna ao OpenClaw, opcionalmente com uma solicitação de acompanhamento:

```text
/openclaw
/openclaw reiniciar gateway
```

## Modo de recuperação por mensagens

O modo de recuperação por mensagens é o ponto de entrada do canal de mensagens para o OpenClaw: use-o quando o agente normal estiver inoperante, mas um canal confiável (por exemplo, WhatsApp) ainda receber comandos.

Este é um manipulador determinístico de comandos de emergência, não o agente
conversacional do OpenClaw. Ele não inicializa uma nova configuração nem flexibiliza o gate de
inferência para o chat do OpenClaw.

Comando compatível: `/openclaw <request>`. A recuperação aceita apenas a gramática exata dos comandos digitados — a linguagem natural é rejeitada com uma dica, nunca convertida por suposição em uma operação, e nenhum modelo é consultado.

```text
Você, em uma MD confiável do proprietário: /openclaw status
OpenClaw: Modo de recuperação do OpenClaw. Gateway acessível: não. Configuração válida: não.
Você: /openclaw restart gateway
OpenClaw: Plano: reiniciar o Gateway. Responda /openclaw yes para aplicar.
Você: /openclaw yes
OpenClaw: Aplicado. Entrada de auditoria gravada.
```

A criação de agentes também pode ser enfileirada localmente ou por meio da recuperação:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/openclaw create agent work workspace ~/Projects/work
```

A criação de agentes pode nomear apenas o modelo padrão atual verificado em execução. Omita o
modelo para herdar essa rota.

A recuperação remota é uma superfície administrativa e deve ser tratada como reparo remoto de configuração, não como chat normal.

Contrato de segurança para recuperação remota:

- Desabilitada quando o sandboxing está ativo para o agente/sessão; o OpenClaw recusa a recuperação remota e indica o reparo pela CLI local.
- O estado efetivo padrão é `auto`: permitir recuperação remota apenas em operação YOLO confiável, na qual o runtime já possui autoridade local sem sandbox (`tools.exec.security` é resolvido como `full` e `tools.exec.ask` é resolvido como `off`, com o modo de sandbox `off`).
- Exige uma identidade explícita do proprietário; nenhuma regra de remetente curinga, política de grupo aberto, Webhook não autenticado ou canal anônimo.
- Por padrão, apenas MDs do proprietário; a recuperação em grupo/canal exige adesão explícita.
- A pesquisa e a listagem de plugins são somente leitura. A instalação de plugins é sempre exclusivamente local (bloqueada na recuperação, mesmo quando habilitada de outra forma), pois baixa código executável. A desinstalação de plugins é recusada tanto no OpenClaw local quanto na recuperação; execute `openclaw plugins uninstall <id>` em um terminal.
- A recuperação remota não pode abrir a TUI local nem alternar para uma sessão interativa do agente; use `openclaw` localmente para transferir para o agente.
- Gravações persistentes ainda exigem aprovação, mesmo no modo de recuperação.
- Aprovações pendentes são de uso único. Qualquer comando de recuperação mais recente para a mesma conta, canal e remetente revoga o plano anterior; uma falha de execução também consome a aprovação, portanto, reenvie o comando para tentar novamente.
- Toda operação de recuperação aplicada é auditada. A recuperação pelo canal de mensagens registra metadados de canal, conta, remetente e endereço de origem; operações que alteram a configuração também registram os hashes da configuração antes e depois.
- Segredos nunca são exibidos. A inspeção de SecretRef informa a disponibilidade, não os valores.
- Se o Gateway estiver ativo, a recuperação dará preferência às operações tipadas do Gateway; se estiver inoperante, a recuperação usará apenas a superfície mínima de reparo local que não depende do loop normal do agente.

Formato da configuração:

```jsonc
{
  "systemAgent": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled`: `"auto"` (padrão) permite a recuperação somente quando o runtime efetivo está em YOLO e o sandboxing está desativado; `false` nunca permite recuperação pelo canal de mensagens; `true` permite explicitamente a recuperação quando as verificações de proprietário/canal são aprovadas (ainda sujeita à recusa por sandboxing).
- `ownerDmOnly`: restringe a recuperação a mensagens diretas do proprietário. Padrão: `true`.
- `pendingTtlMinutes`: por quanto tempo uma gravação de recuperação pendente permanece aberta para aprovação por `/openclaw yes` antes de expirar. Padrão: `15`.

`openclaw doctor --fix` migra o bloco de configuração legado `crestodian` para
`systemAgent`. O runtime lê apenas o bloco canônico.

A recuperação remota é coberta pela trilha do Docker:

```bash
pnpm test:docker:system-agent-rescue
```

Um teste de fumaça opcional da superfície de comandos do canal em execução verifica `/openclaw status`, além de um ciclo persistente de aprovação por meio do manipulador de recuperação:

```bash
pnpm test:live:system-agent-rescue-channel
```

A configuração única empacotada e protegida por gate de inferência é coberta por:

```bash
pnpm test:docker:system-agent-first-run
```

Essa trilha da CLI empacotada começa com um diretório de estado vazio e comprova que o OpenClaw
falha de forma fechada sem inferência. Em seguida, testa e ativa um Claude falso por meio
do módulo de ativação empacotado. Somente depois disso uma solicitação aproximada chega ao
planejador e é resolvida como configuração tipada, seguida por comandos únicos que criam um
agente adicional, configuram o Discord por meio da habilitação de um plugin e de um SecretRef
de token, validam a configuração e verificam o log de auditoria. Essa trilha fornece evidências
de gate/operação; ela não exercita a integração interativa nem a conversa de
agente/ferramenta/aprovação do OpenClaw. O cenário do QA Lab a seguir redireciona
para a mesma trilha do Docker:

```bash
pnpm openclaw qa suite --scenario system-agent-ring-zero-setup
```

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Doctor](/pt-BR/cli/doctor)
- [TUI](/pt-BR/cli/tui)
- [Sandbox](/pt-BR/cli/sandbox)
- [Segurança](/pt-BR/cli/security)
