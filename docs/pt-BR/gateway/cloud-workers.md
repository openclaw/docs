---
read_when: You want agent sessions to run on ephemeral cloud machines instead of the Gateway host, or you are configuring cloudWorkers profiles.
sidebarTitle: Cloud Workers
status: active
summary: 'Encaminhe sessões para máquinas temporárias na nuvem: provisionamento, runtime de worker, inferência via proxy e transmissão de resultados em tempo real'
title: Workers na nuvem
x-i18n:
    generated_at: "2026-07-16T12:25:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c20b3b4f1408ed3ef0beb155a207f99476323cf67eba7b44931eec32c79e52be
    source_path: gateway/cloud-workers.md
    workflow: 16
---

Os workers na nuvem permitem que uma sessão execute seu loop de agente em uma máquina de nuvem descartável, enquanto tudo relacionado à sessão permanece onde sempre esteve: visível na barra lateral, transmitido ao vivo, com a transcrição pertencendo ao Gateway. O Gateway obtém uma máquina por concessão, instala nela uma cópia fixada do OpenClaw, sincroniza o workspace da sessão e entrega o loop do turno a um processo `openclaw worker` restrito. As chamadas de modelo são encaminhadas de volta pelo Gateway, portanto as credenciais do provedor nunca saem da sua máquina, e o cache de prompts continua funcionando porque o provedor vê um fluxo contínuo único.

Quando o trabalho termina (ou a máquina falha), ela é descartada. O estado durável — transcrição, commits do workspace, registros de alocação — permanece com o Gateway.

<Note>
Os workers na nuvem são opcionais e permanecem invisíveis até que um perfil seja configurado. Instalações não configuradas não veem novos RPCs, configurações nem elementos de interface.
</Note>

## O que é executado onde

| Aspecto                                                 | Local                                                                            |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Loop do agente + ferramentas (`exec`, `read`, `write`, `edit`, …) | Máquina do worker na nuvem                                                       |
| Inferência do modelo e credenciais do provedor          | Gateway (encaminhadas pela referência `{provider, model}`)                        |
| Transcrição (durável, armazenamento da sessão)          | Gateway                                                                          |
| Transmissão ao vivo para a barra lateral                | Fanout do Gateway, alimentado pelo fluxo de eventos reproduzível do worker        |
| Histórico do Git do workspace                           | Criado na máquina sem credenciais; o Gateway adota os commits e gerencia push/PR |

A máquina não precisa de portas de entrada além de `sshd`: o Gateway estabelece uma conexão de saída via SSH fixado, e um túnel reverso transporta o WebSocket do worker de volta. O provedor Crabbox incluído força a rota SSH pública e desativa a inclusão gerenciada no Tailscale. O acesso de saída à internet é definido pela política do provedor; o perfil padrão da AWS pode acessar a internet, a menos que sua rede ou seu grupo de segurança seja restringido.

## Requisitos

- Um Plugin de provedor de worker. O Plugin `crabbox` incluído opera a CLI do [Crabbox](https://github.com/openclaw/crabbox), que intermedeia concessões entre backends de nuvem (AWS, Hetzner e outros). O binário `crabbox` deve estar em `PATH` (ou defina `settings.binary`), com as credenciais do provedor já configuradas. A admissão na AWS exige o Crabbox 0.38.1 ou mais recente.
- Para workers Crabbox na AWS, o `aws.instanceProfile` efetivo deve estar vazio. O provedor verifica `crabbox config show --json` antes da alocação e, em seguida, exige que `crabbox inspect --json` informe `providerMetadata.instanceProfileAttached: false` nos `DescribeInstances` da EC2. Concessões com uma função de instância ou sem metadados autoritativos são encerradas e rejeitadas.
- Node.js na máquina concedida. Imagens de nuvem básicas normalmente não o incluem — instale-o no comando `setup` do perfil.
- Uma sessão com um worktree gerenciado pertencente à sessão (crie um com `worktree: true`). O despacho move o conteúdo desse worktree; diretórios comuns são sincronizados como um espelho de manifesto.

## Configuração

Adicione um perfil em `cloudWorkers.profiles` no `openclaw.json`:

```json
{
  "cloudWorkers": {
    "profiles": {
      "aws": {
        "provider": "crabbox",
        "install": "bundle",
        "settings": {
          "provider": "aws",
          "class": "standard",
          "ttl": "8h",
          "idleTimeout": "45m",
          "setup": "test -x /usr/bin/node || (curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs)"
        }
      }
    }
  }
}
```

Campos do perfil:

| Chave      | Significado                                                                                                                                                                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | ID do provedor de worker registrado por um Plugin (`crabbox` para o Plugin incluído).                                                                                                                                                          |
| `install`  | `bundle` (padrão) envia a compilação do Gateway em execução; `npm` instala a versão exata do Gateway lançada com integridade fixada. `npm` exige que o Gateway seja executado a partir de uma versão empacotada.          |
| `settings` | JSON pertencente ao provedor. Para o crabbox: `provider` (backend), `class` (classe da máquina), `ttl`, `idleTimeout` (durações do Go), `setup` opcional e caminho absoluto `binary`. O OpenClaw força o SSH público e desativa o Tailscale gerenciado para essas concessões. |
| `lifetime` | Política armazenada opcional (`idleTimeoutMinutes`, `maxLifetimeMinutes`).                                                                                                                                                                   |

### O comando de configuração

`settings.setup` é executado na máquina concedida depois que ela está pronta para SSH e antes da instalação do OpenClaw. Ele é executado em **todas** as tentativas de provisionamento (incluindo repetições após um despacho interrompido), portanto deve ser idempotente — proteja as instalações com uma verificação de `command -v`/`test -x`, como no exemplo. Se a configuração falhar, o provedor encerra a concessão e o despacho falha de forma segura; nenhuma máquina parcialmente configurada permanece em execução.

### Canais de instalação

- **`bundle`** empacota o `dist` do Gateway em execução, um `package.json` reduzido e todos os pacotes do workspace referenciados pela compilação, todos protegidos por um hash de conteúdo. A máquina verifica o pacote intacto em relação a esse hash e, em seguida, instala as dependências npm de produção (com scripts desativados). É assim que uma compilação de desenvolvimento é executada em um worker.
- **`npm`** comprova que a versão existe no registro público, fixa sua integridade SHA-512 e instala o `openclaw@<version>` correspondente exatamente ao Gateway.

## Despacho de uma sessão

Na interface de controle, abra **Nova sessão**, escolha um agente cujo runtime configurado seja o OpenClaw, selecione um destino **Nuvem · perfil** configurado no menu **Onde** e inicie a tarefa. A seleção da nuvem ativa automaticamente o worktree gerenciado obrigatório; o Gateway cria a sessão, conclui o despacho e somente depois envia o primeiro turno. O selo do servidor na barra lateral da sessão mostra o estado durável da alocação. Destinos de nuvem não são oferecidos para catálogos de sessões de CLI externas.

O fluxo RPC equivalente é:

Crie uma sessão com um worktree gerenciado e depois a despache (o RPC exige `operator.admin` e só existe quando há perfis configurados):

Os workers na nuvem executam o runtime de agente do OpenClaw. Escolha um `openai/*` ou outro modelo resolvido para esse runtime; sessões configuradas para um runtime de CLI externa, como `claude-cli`, não podem ser despachadas.

```bash
openclaw gateway call sessions.create \
  --params '{"key":"agent:main:big-refactor","worktree":true,"cwd":"/path/to/repo","worktreeName":"big-refactor"}'

openclaw gateway call sessions.dispatch \
  --timeout 1500000 \
  --params '{"key":"agent:main:big-refactor","profileId":"aws"}'
```

`sessions.dispatch` encerra a admissão de turnos locais, aguarda o trabalho ativo terminar, provisiona a concessão, executa a configuração, inicializa o OpenClaw, sincroniza o workspace e retorna quando a alocação atinge a propriedade do worker `active`. Reserve vários minutos para o primeiro despacho; concessões e instalações são armazenadas em cache quando o provedor oferece suporte. Depois disso, interaja com a sessão normalmente — os turnos são roteados automaticamente para o worker.

Os turnos concluídos do worker reconciliam os arquivos do workspace elegíveis e dentro do limite de tamanho de volta ao worktree gerenciado da sessão antes que a reivindicação do turno seja liberada. O evento terminal do worker cria uma barreira durável de resultado pendente antes de ser confirmado, portanto a recuperação após reinicialização do Gateway traz o workspace remoto de volta antes que a limpeza de turnos obsoletos possa destruir seu proprietário. A reconciliação autentica o manifesto do worker e é interrompida em caso de divergência local, em vez de sobrescrever qualquer um dos lados. Antes de alterar arquivos, o Gateway armazena um diário de reversão limitado em seu banco de dados de estado SQLite; uma nova tentativa recupera esse diário após a interrupção de um processo do Gateway. Os resultados do workspace usam a semântica de arquivos do Git: arquivos regulares, bits executáveis, links simbólicos, adições, alterações e exclusões são mantidos, enquanto diretórios vazios e outros modos de diretório não são. Objetos de commit remotos não são mantidos; as alterações de arquivo resultantes permanecem no worktree gerenciado para revisão e commit normais.

Quando o trabalho estiver concluído e nenhum turno estiver em execução, abra o menu da sessão e escolha **Parar worker na nuvem…**. O Gateway realiza uma reconciliação final do workspace antes de destruir o ambiente. Uma alocação que já esteja em `draining` ou `reconciling` está concluindo o encerramento; aguarde até que seu selo mude para `reclaimed` antes de excluir a sessão.

Para um worker anexado com falha ou fora de controle, um operador pode chamar `environments.destroy` com `{ "force": true }` como último recurso. O encerramento forçado marca de forma durável a alocação como falha e abandona qualquer resultado remoto não reconciliado antes de destruir o ambiente.

O RPC administrativo equivalente é:

```bash
openclaw gateway call sessions.reclaim \
  --timeout 600000 \
  --params '{"key":"agent:main:big-refactor"}'
```

A alocação percorre uma máquina de estados durável (`local → requested → provisioning → syncing → starting → active`), portanto uma reinicialização do Gateway no meio do despacho realiza a reconciliação em vez de deixar máquinas órfãs. Um turno de modelo com falha mantém a alocação ativa disponível para uma nova tentativa. Se a reconciliação de entrada do workspace falhar, o worker também permanece ativo para que o operador possa resolver o conflito local e tentar novamente sem perder o resultado remoto; falhas de ciclo de vida, por outro lado, movem a alocação para um estado de erro ou recuperado e preservam o trecho final de diagnóstico.

## Modelo de segurança

- **Entrada do worker fechada.** Os workers se comunicam por um protocolo dedicado no soquete encapsulado, com uma lista fechada de métodos permitidos — um worker não pode chamar RPCs de operador.
- **Credenciais emitidas, com hash em repouso.** Cada despacho emite uma credencial de worker; o Gateway armazena apenas seu hash. A rotação de credenciais e o isolamento por época do proprietário garantem no máximo um proprietário ativo por sessão — um worker obsoleto que se reconecta é isolado, nunca mesclado.
- **Fixação da chave do host.** O provedor deve disponibilizar a chave de host SSH da máquina no momento do provisionamento; a inicialização se conecta com fixação estrita e falha de forma segura sem ela.
- **Nenhuma credencial permanente de modelo, forge ou nuvem na máquina.** A autenticação do modelo permanece no Gateway (a inferência trafega pela referência `{provider, model}`), os commits do Git do workspace são criados sem credenciais de forge, e os metadados da concessão Crabbox na AWS são verificados de forma autoritativa quanto à presença de uma função de instância antes da configuração. Mantenha também os comandos de configuração livres de credenciais.
- **Saída pertencente ao provedor.** O túnel reverso elimina qualquer necessidade de acesso direto do OpenClaw ao modelo, mas o OpenClaw não reconfigura os firewalls do provedor. Restrinja o tráfego de saída no provedor do worker quando a tarefa exigir.
- **Transcrições duráveis, exatamente uma vez.** O worker confirma lotes de transcrição por meio de um protocolo de comparação e troca em relação à folha da sessão; uma base obsoleta interrompe a execução de forma segura, em vez de duplicar ou fazer rebase de uma saída paga.

## Solução de problemas

- **`sessions.dispatch` é um método desconhecido** — nenhum `cloudWorkers.profiles` está configurado ou o chamador não tem `operator.admin`.
- **"Os turnos de workers na nuvem exigem o runtime do OpenClaw"** — escolha um modelo cujo runtime configurado seja o OpenClaw. Runtimes de CLI externos, como `claude-cli`, não são compatíveis com inferência de workers.
- **"A inicialização do worker exige Node.js no host alugado"** — adicione uma instalação do Node a `settings.setup` (veja acima).
- **A atestação da função de instância da AWS falha** — limpe `aws.instanceProfile` (e `CRABBOX_AWS_INSTANCE_PROFILE`, se definido). Instale o Crabbox 0.38.1 ou mais recente; binários mais antigos não expõem o contrato autoritativo `providerMetadata.instanceProfileAttached` exigido para admissão na AWS.
- **O despacho falha com um erro do provedor** — o registro de posicionamento e `environments.list` mantêm o último erro, incluindo o trecho final do stderr da configuração/inicialização. As boxes são destruídas em caso de falha, portanto esse trecho final é a principal fonte forense.
- **Tempo limite do cliente durante o despacho** — `openclaw gateway call` usa por padrão um tempo limite de 10s; forneça `--timeout` com folga (o despacho continua sendo executado no servidor de qualquer forma, e uma nova tentativa durante o provisionamento é rejeitada com `session cannot dispatch from placement provisioning`).
- **Manutenção de leases** — `crabbox list --provider <backend>` mostra leases ativos; `crabbox stop --provider <backend> --id <lease>` libera um manualmente. Leases ociosos expiram conforme o `idleTimeout` do perfil.

## Relacionado

- [Sandboxing](/pt-BR/gateway/sandboxing) — redução do raio de impacto da execução local de ferramentas
- [CLI de sessões](/pt-BR/cli/sessions) — inspeção das sessões armazenadas
- [Referência de configuração](/pt-BR/gateway/configuration-reference)
