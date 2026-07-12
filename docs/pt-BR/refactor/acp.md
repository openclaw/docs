---
read_when:
    - Refatoração do ciclo de vida da sessão ACP ou da limpeza de processos ACPX
    - Depuração de processos órfãos do ACPX, reutilização de PID ou segurança da limpeza em múltiplos gateways
    - Alteração da visibilidade de `sessions_list` para sessões ACP ou de subagentes iniciadas
    - Projetando metadados de propriedade para tarefas em segundo plano, sessões ACP ou concessões de processo
sidebarTitle: ACP lifecycle refactor
summary: Plano de migração para tornar explícita a propriedade da sessão ACP e do processo ACPX
title: Refatoração do ciclo de vida do ACP
x-i18n:
    generated_at: "2026-07-12T00:21:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7f4ee447e0b436601c68251c26c1b897a642f6a8b1886d18647b62817996792
    source_path: refactor/acp.md
    workflow: 16
---

O ciclo de vida do ACP funciona atualmente, mas uma parte excessiva dele é inferida posteriormente.
A limpeza de processos reconstrói a propriedade com base em PIDs, strings de comando, caminhos de
wrappers e na tabela de processos ativos. A visibilidade das sessões reconstrói a propriedade
com base nas strings de chave de sessão, além de consultas secundárias `sessions.list({ spawnedBy })`.
Isso possibilita correções pontuais, mas também facilita deixar casos extremos passarem despercebidos:
reutilização de PID, comandos entre aspas, processos descendentes de adaptadores, raízes de estado de
vários Gateways, `cancel` em comparação com `close` e visibilidade `tree` em comparação com `all`
tornam-se locais separados onde as mesmas regras de propriedade precisam ser redescobertas.

Esta refatoração torna a propriedade um conceito de primeira classe. O objetivo não é criar uma nova
superfície de produto ACP; é estabelecer um contrato interno mais seguro para o comportamento existente
do ACP e do ACPX.

## Objetivos

- A limpeza nunca envia sinais a um processo, a menos que as evidências atuais do processo ativo
  correspondam a uma concessão pertencente ao OpenClaw.
- `cancel`, `close` e a limpeza na inicialização têm intenções distintas de ciclo de vida.
- `sessions_list`, `sessions_history`, `sessions_send` e as verificações de status usam
  o mesmo modelo de sessão pertencente ao solicitante.
- Instalações com vários Gateways não podem encerrar os wrappers ACPX umas das outras.
- Registros antigos de sessões ACPX continuam funcionando durante a migração.
- O runtime continua pertencendo ao Plugin; o núcleo não passa a conhecer detalhes do pacote ACPX.

## Fora do escopo

- Substituir o ACPX ou alterar a superfície pública do comando `/acp`.
- Mover para o núcleo o comportamento de adaptadores ACP específico de fornecedores.
- Exigir que os usuários limpem manualmente o estado antes de atualizar.
- Fazer com que `cancel` feche sessões ACP reutilizáveis.

## Modelo de destino

### Identidade da instância do Gateway

Cada processo do Gateway deve ter um ID estável de instância do runtime:

```ts
type GatewayInstanceId = string;
```

Ele pode ser gerado na inicialização do Gateway e persistido no estado durante toda a vida útil
dessa instalação. Não é um segredo de segurança; é um discriminador de propriedade usado
para evitar confundir os processos ACP de um Gateway com os processos de outro Gateway.

### Propriedade da sessão ACP

Cada sessão ACP iniciada deve ter metadados normalizados de propriedade:

```ts
type AcpSessionOwner = {
  sessionKey: string;
  spawnedBy?: string;
  parentSessionKey?: string;
  ownerSessionKey: string;
  agentId: string;
  backend: "acpx";
  gatewayInstanceId: GatewayInstanceId;
  createdAt: number;
};
```

O Gateway deve retornar esses campos nas linhas de sessão em que forem conhecidos.
A filtragem de visibilidade deve ser uma verificação pura sobre os metadados da linha:

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

Isso remove das verificações de visibilidade as chamadas secundárias ocultas
`sessions.list({ spawnedBy })`. Uma sessão ACP filha iniciada entre agentes pertence ao
solicitante porque a linha assim o declara, não porque uma segunda consulta por acaso a encontrou.

### Concessões de processos ACPX

Cada inicialização de wrapper gerado deve criar um registro de concessão:

```ts
type AcpxProcessLease = {
  leaseId: string;
  gatewayInstanceId: GatewayInstanceId;
  sessionKey: string;
  wrapperRoot: string;
  wrapperPath: string;
  rootPid: number;
  processGroupId?: number;
  commandHash: string;
  startedAt: number;
  state: "open" | "closing" | "closed" | "lost";
};
```

O processo do wrapper deve receber o ID da concessão e o ID da instância do Gateway em seu
ambiente:

```sh
OPENCLAW_ACPX_LEASE_ID=...
OPENCLAW_GATEWAY_INSTANCE_ID=...
```

Quando a plataforma permitir, a verificação deve preferir metadados do processo ativo
que não possam ser confundidos por aspas no comando:

- o PID raiz ainda existe
- o caminho do wrapper ativo está sob `wrapperRoot`
- o grupo de processos corresponde à concessão, quando disponível
- o ambiente contém o ID de concessão esperado, quando puder ser lido
- o hash do comando ou o caminho do executável corresponde à concessão

Se não for possível verificar o processo ativo, a limpeza falhará de forma fechada.

## Controlador do ciclo de vida

Introduza um único controlador do ciclo de vida do ACPX que seja responsável pelas concessões
de processos e pela política de limpeza:

```ts
interface AcpxLifecycleController {
  ensureSession(input: AcpRuntimeEnsureInput): Promise<AcpRuntimeHandle>;
  cancelTurn(handle: AcpRuntimeHandle): Promise<void>;
  closeSession(input: {
    handle: AcpRuntimeHandle;
    discardPersistentState?: boolean;
    reason?: string;
  }): Promise<void>;
  reapStartupOrphans(): Promise<void>;
  verifyOwnedTree(lease: AcpxProcessLease): Promise<OwnedProcessTree | null>;
}
```

`cancelTurn` solicita apenas o cancelamento do turno. Ele não deve encerrar processos reutilizáveis
do wrapper ou do adaptador.

`closeSession` pode encerrar processos, mas somente depois de carregar o registro da sessão,
carregar a concessão e verificar se a árvore de processos ativa ainda pertence a essa
concessão.

`reapStartupOrphans` começa pelas concessões abertas no estado. Ele pode usar a tabela de
processos para encontrar descendentes, mas não deve primeiro examinar comandos arbitrários
que pareçam relacionados ao ACP e depois decidir que provavelmente são nossos.

## Contrato do wrapper

Os wrappers gerados devem permanecer pequenos. Eles devem:

- iniciar o adaptador em um grupo de processos, quando houver suporte
- encaminhar sinais normais de encerramento ao grupo de processos
- detectar a morte do processo pai
- quando o processo pai morrer, enviar SIGTERM e manter o wrapper ativo até que
  o fallback com SIGKILL seja executado
- informar o PID raiz e o ID do grupo de processos ao controlador do ciclo de vida quando
  essas informações estiverem disponíveis

Os wrappers não devem decidir a política de sessão. Eles apenas aplicam a limpeza local da
árvore de processos ao seu próprio grupo de adaptadores.

## Contrato de visibilidade das sessões

A visibilidade deve usar a propriedade normalizada da linha:

```ts
type SessionVisibilityInput = {
  requesterSessionKey: string;
  row: {
    key: string;
    agentId: string;
    ownerSessionKey?: string;
    spawnedBy?: string;
    parentSessionKey?: string;
  };
  visibility: "self" | "tree" | "agent" | "all";
  a2aPolicy: AgentToAgentPolicy;
};
```

Regras:

- `self`: somente a sessão solicitante.
- `tree`: a sessão solicitante e as linhas pertencentes a ela ou iniciadas a partir dela.
- `all`: todas as linhas do mesmo agente, linhas entre agentes permitidas pela política a2a
  e linhas iniciadas entre agentes pertencentes ao solicitante, mesmo quando a política a2a
  geral estiver desabilitada.
- `agent`: somente o mesmo agente, a menos que uma relação explícita de propriedade indique
  que a linha pertence ao solicitante.

Isso torna `tree` e `all` monotônicos: `all` não deve ocultar uma sessão filha pertencente ao
solicitante que `tree` mostraria.

## Plano de migração

### Fase 1: adicionar identidade e concessões

- Adicionar `gatewayInstanceId` ao estado do Gateway.
- Adicionar um armazenamento de concessões do ACPX no diretório de estado do ACPX.
- Gravar uma concessão antes de iniciar um wrapper gerado.
- Armazenar `leaseId` nos novos registros de sessões ACPX.
- Manter os campos existentes de PID e comando para registros antigos.

### Fase 2: limpeza priorizando concessões

- Alterar a limpeza de fechamento para carregar `leaseId` primeiro.
- Verificar a propriedade do processo ativo em relação à concessão antes de enviar sinais.
- Manter o fallback atual de PID raiz e raiz do wrapper somente para registros legados.
- Marcar as concessões como `closed` após a limpeza verificada.
- Marcar as concessões como `lost` quando o processo desaparecer antes da limpeza.

### Fase 3: limpeza na inicialização priorizando concessões

- A limpeza na inicialização examina as concessões abertas.
- Para cada concessão, verificar o processo raiz e coletar seus descendentes.
- Encerrar as árvores verificadas começando pelos processos filhos.
- Expirar concessões antigas `closed` e `lost` com uma janela de retenção limitada.
- Manter a busca por marcadores de comando apenas como fallback legado temporário,
  protegida pela raiz do wrapper e pela instância do Gateway, quando possível.

### Fase 4: linhas de propriedade das sessões

- Adicionar metadados de propriedade às linhas de sessão do Gateway.
- Fazer com que os gravadores do ACPX, de subagentes, de tarefas em segundo plano e do
  armazenamento de sessões preencham `ownerSessionKey` ou `spawnedBy`.
- Converter as verificações de visibilidade de sessões para usar os metadados das linhas.
- Remover das verificações de visibilidade as consultas secundárias
  `sessions.list({ spawnedBy })`.

### Fase 5: remover heurísticas legadas

Após uma janela de lançamento:

- deixar de depender das strings de comando raiz armazenadas para a limpeza de registros ACPX
  não legados
- remover buscas por marcadores de comando na inicialização
- remover consultas de listagem usadas como fallback de visibilidade
- manter o comportamento defensivo de falha fechada para concessões ausentes ou
  impossíveis de verificar

## Testes

Adicione duas suítes orientadas por tabelas.

Simulador do ciclo de vida dos processos:

- PID reutilizado por um processo não relacionado
- PID reutilizado pela raiz do wrapper de outro Gateway
- o comando armazenado do wrapper usa aspas de shell, mas o comando ativo em `ps` não
- o processo filho do adaptador termina, mas o processo descendente permanece no grupo de processos
- o fallback com SIGTERM após a morte do processo pai chega ao SIGKILL
- listagem de processos indisponível
- concessão obsoleta com processo ausente
- processo órfão na inicialização com wrapper, processo filho do adaptador e processo descendente

Matriz de visibilidade das sessões:

- `self`, `tree`, `agent`, `all`
- a2a habilitado e desabilitado
- linha do mesmo agente
- linha de outro agente
- linha ACP de outro agente iniciada e pertencente ao solicitante
- solicitante em sandbox limitado a `tree`
- ações de listagem, histórico, envio e status

A invariante importante: uma sessão filha iniciada e pertencente ao solicitante fica visível
sempre que a visibilidade configurada inclui a árvore da sessão solicitante, e `all` não tem
menos recursos que `tree`.

## Notas de compatibilidade

Registros de sessões antigos podem não ter `leaseId`. Eles devem usar o caminho legado
de limpeza com falha fechada:

- exigir um processo raiz ativo
- exigir propriedade da raiz do wrapper quando um wrapper gerado for esperado
- exigir correspondência de comandos para raízes que não sejam wrappers
- nunca enviar sinais com base apenas em metadados obsoletos de PID armazenados

Se um registro legado não puder ser verificado, deixe-o intacto. A limpeza de concessões na
inicialização e a próxima janela de lançamento devem acabar tornando o fallback obsoleto.

## Critérios de sucesso

- Fechar uma sessão ACPX antiga ou obsoleta não pode encerrar o processo de outro Gateway.
- A morte do processo pai não deixa processos descendentes persistentes do adaptador em execução.
- `cancel` interrompe o turno ativo sem fechar sessões reutilizáveis.
- `sessions_list` pode mostrar sessões ACP filhas de outros agentes pertencentes ao solicitante
  tanto em `tree` quanto em `all`.
- A limpeza na inicialização é orientada por concessões, não por buscas amplas em strings de comando.
- Os testes específicos da matriz de processos e visibilidade abrangem todos os casos extremos
  que anteriormente exigiam correções pontuais durante a revisão.
