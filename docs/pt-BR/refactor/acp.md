---
read_when:
    - Refatoração do ciclo de vida da sessão ACP ou limpeza do processo ACPX
    - Depuração de processos órfãos do ACPX, reutilização de PID ou segurança da limpeza multi-Gateway
    - Alterando a visibilidade de sessions_list para sessões ACP ou de subagente criadas
    - Projetando metadados de propriedade para tarefas em segundo plano, sessões ACP ou concessões temporárias de processo
sidebarTitle: ACP lifecycle refactor
summary: Plano de migração para tornar explícita a propriedade da sessão ACP e do processo ACPX
title: Refatoração do ciclo de vida do ACP
x-i18n:
    generated_at: "2026-05-07T13:24:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f4ee447e0b436601c68251c26c1b897a642f6a8b1886d18647b62817996792
    source_path: refactor/acp.md
    workflow: 16
    postprocess_version: locale-links-v1
---

O ciclo de vida do ACP funciona atualmente, mas uma parte excessiva dele é inferida depois do ocorrido.
A limpeza de processos reconstrói a propriedade a partir de PIDs, strings de comando, caminhos de encapsulador e a tabela de processos ativa. A visibilidade de sessão reconstrói a propriedade a partir de strings de chave de sessão mais consultas secundárias `sessions.list({ spawnedBy })`.
Isso torna correções estreitas possíveis, mas também facilita a perda de casos de borda:
reutilização de PID, comandos entre aspas, netos de adaptador, raízes de estado com múltiplos Gateways,
`cancel` versus `close`, e visibilidade `tree` versus `all` passam a ser lugares separados para redescobrir as mesmas regras de propriedade.

Esta refatoração torna a propriedade um conceito de primeira classe. O objetivo não é uma nova superfície de produto ACP;
é um contrato interno mais seguro para o comportamento ACP e ACPX existente.

## Objetivos

- A limpeza nunca sinaliza um processo a menos que a evidência ativa atual corresponda a uma concessão de propriedade da OpenClaw.
- `cancel`, `close` e coleta na inicialização têm intenções distintas de ciclo de vida.
- `sessions_list`, `sessions_history`, `sessions_send` e verificações de status usam o mesmo modelo de sessão pertencente ao solicitante.
- Instalações com múltiplos Gateways não podem coletar os encapsuladores ACPX umas das outras.
- Registros antigos de sessão ACPX continuam funcionando durante a migração.
- O runtime continua pertencendo ao Plugin; o núcleo não aprende detalhes do pacote ACPX.

## Não objetivos

- Substituir ACPX ou alterar a superfície pública do comando `/acp`.
- Mover comportamento de adaptador ACP específico de fornecedor para o núcleo.
- Exigir que usuários limpem o estado manualmente antes de atualizar.
- Fazer `cancel` fechar sessões ACP reutilizáveis.

## Modelo-alvo

### Identidade de Instância do Gateway

Cada processo de Gateway deve ter um ID estável de instância de runtime:

```ts
type GatewayInstanceId = string;
```

Ele pode ser gerado na inicialização do Gateway e persistido no estado durante a vida dessa instalação. Ele não é um segredo de segurança; é um discriminador de propriedade usado para evitar confundir os processos ACP de um Gateway com os processos de outro Gateway.

### Propriedade de Sessão ACP

Toda sessão ACP iniciada deve ter metadados normalizados de propriedade:

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

O Gateway deve retornar esses campos nas linhas de sessão onde eles forem conhecidos.
A filtragem de visibilidade deve ser uma verificação pura sobre metadados da linha:

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

Isso remove chamadas secundárias ocultas `sessions.list({ spawnedBy })` das verificações de visibilidade. Um filho ACP entre agentes iniciado é pertencente ao solicitante porque a linha diz isso, não porque uma segunda consulta por acaso o encontra.

### Concessões de Processo ACPX

Cada inicialização de encapsulador gerado deve criar um registro de concessão:

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

O processo encapsulador deve receber o ID da concessão e o ID da instância do Gateway em seu ambiente:

```sh
OPENCLAW_ACPX_LEASE_ID=...
OPENCLAW_GATEWAY_INSTANCE_ID=...
```

Quando a plataforma permitir, a verificação deve preferir metadados de processo ativo que não possam ser confundidos por aspas no comando:

- o PID raiz ainda existe
- o caminho ativo do encapsulador está sob `wrapperRoot`
- o grupo de processos corresponde à concessão quando disponível
- o ambiente contém o ID de concessão esperado quando legível
- o hash do comando ou o caminho do executável corresponde à concessão

Se o processo ativo não puder ser verificado, a limpeza falha de forma fechada.

## Controlador de Ciclo de Vida

Introduza um controlador de ciclo de vida ACPX que possua as concessões de processo e a política de limpeza:

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

`cancelTurn` solicita apenas o cancelamento do turno. Ele não deve coletar processos reutilizáveis de encapsulador ou adaptador.

`closeSession` pode coletar, mas somente após carregar o registro da sessão, carregar a concessão e verificar que a árvore de processos ativa ainda pertence a essa concessão.

`reapStartupOrphans` começa pelas concessões abertas no estado. Ele pode usar a tabela de processos para encontrar descendentes, mas não deve primeiro varrer comandos arbitrários com aparência de ACP e então decidir que provavelmente são nossos.

## Contrato do Encapsulador

Os encapsuladores gerados devem permanecer pequenos. Eles devem:

- iniciar o adaptador em um grupo de processos quando houver suporte
- encaminhar sinais normais de término para o grupo de processos
- detectar a morte do pai
- na morte do pai, enviar SIGTERM e então manter o encapsulador ativo até que o fallback SIGKILL seja executado
- relatar o PID raiz e o ID do grupo de processos de volta ao controlador de ciclo de vida quando isso estiver disponível

Os encapsuladores não devem decidir a política de sessão. Eles apenas aplicam a limpeza local da árvore de processos para seu próprio grupo de adaptador.

## Contrato de Visibilidade de Sessão

A visibilidade deve usar propriedade normalizada da linha:

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
- `tree`: sessão solicitante mais linhas pertencentes ao solicitante ou iniciadas a partir dele.
- `all`: todas as linhas do mesmo agente, linhas entre agentes permitidas por a2a e linhas entre agentes iniciadas e pertencentes ao solicitante, mesmo quando a2a geral estiver desabilitado.
- `agent`: somente o mesmo agente, a menos que uma relação explícita de propriedade diga que a linha pertence ao solicitante.

Isso torna `tree` e `all` monotônicos: `all` não deve ocultar um filho pertencente ao solicitante que `tree` mostraria.

## Plano de Migração

### Fase 1: Adicionar Identidade e Concessões

- Adicione `gatewayInstanceId` ao estado do Gateway.
- Adicione um armazenamento de concessões ACPX sob o diretório de estado ACPX.
- Escreva uma concessão antes de iniciar um encapsulador gerado.
- Armazene `leaseId` em novos registros de sessão ACPX.
- Mantenha os campos existentes de PID e comando para registros antigos.

### Fase 2: Limpeza Prioritariamente por Concessão

- Altere a limpeza de fechamento para carregar `leaseId` primeiro.
- Verifique a propriedade do processo ativo contra a concessão antes de sinalizar.
- Mantenha o fallback atual de PID raiz e raiz de encapsulador somente para registros legados.
- Marque concessões como `closed` após a limpeza verificada.
- Marque concessões como `lost` quando o processo tiver desaparecido antes da limpeza.

### Fase 3: Coleta de Inicialização Prioritariamente por Concessão

- A coleta de inicialização varre concessões abertas.
- Para cada concessão, verifique o processo raiz e colete descendentes.
- Colete árvores verificadas dos filhos para o pai.
- Expire concessões antigas `closed` e `lost` com uma janela de retenção limitada.
- Mantenha a varredura por marcador de comando apenas como fallback legado temporário, protegida pela raiz de encapsulador e pela instância do Gateway quando possível.

### Fase 4: Linhas de Propriedade de Sessão

- Adicione metadados de propriedade às linhas de sessão do Gateway.
- Ensine gravadores de ACPX, subagente, tarefa em segundo plano e armazenamento de sessão a preencher `ownerSessionKey` ou `spawnedBy`.
- Converta verificações de visibilidade de sessão para usar metadados da linha.
- Remova consultas secundárias `sessions.list({ spawnedBy })` em tempo de visibilidade.

### Fase 5: Remover Heurísticas Legadas

Após uma janela de lançamento:

- pare de depender de strings armazenadas de comando raiz para limpeza ACPX não legada
- remova varreduras de inicialização por marcador de comando
- remova consultas de lista de fallback de visibilidade
- mantenha o comportamento defensivo de falha fechada para concessões ausentes ou não verificáveis

## Testes

Adicione dois conjuntos orientados por tabelas.

Simulador de ciclo de vida de processos:

- PID reutilizado por processo não relacionado
- PID reutilizado pela raiz de encapsulador de outro Gateway
- comando armazenado do encapsulador está entre aspas de shell, comando `ps` ativo não está
- filho do adaptador sai, neto permanece no grupo de processos
- fallback SIGTERM por morte do pai chega ao SIGKILL
- listagem de processos indisponível
- concessão obsoleta com processo ausente
- órfão de inicialização com encapsulador, filho do adaptador e neto

Matriz de visibilidade de sessão:

- `self`, `tree`, `agent`, `all`
- a2a habilitado e desabilitado
- linha do mesmo agente
- linha entre agentes
- linha ACP entre agentes iniciada e pertencente ao solicitante
- solicitante em sandbox limitado a `tree`
- ações de lista, histórico, envio e status

A invariável importante: um filho iniciado pertencente ao solicitante é visível onde quer que a visibilidade configurada inclua a árvore de sessão do solicitante, e `all` não é menos capaz que `tree`.

## Notas de Compatibilidade

Registros antigos de sessão podem não ter `leaseId`. Eles devem usar o caminho legado de limpeza com falha fechada:

- exigir um processo raiz ativo
- exigir propriedade da raiz de encapsulador quando um encapsulador gerado for esperado
- exigir concordância de comando para raízes que não sejam encapsuladoras
- nunca sinalizar apenas com base em metadados obsoletos de PID armazenado

Se um registro legado não puder ser verificado, deixe-o em paz. A limpeza de concessões na inicialização e a próxima janela de lançamento devem eventualmente aposentar o fallback.

## Critérios de Sucesso

- Fechar uma sessão ACPX antiga ou obsoleta não pode matar o processo de outro Gateway.
- A morte do pai não deixa netos persistentes do adaptador em execução.
- `cancel` aborta o turno ativo sem fechar sessões reutilizáveis.
- `sessions_list` pode mostrar filhos ACP entre agentes pertencentes ao solicitante sob `tree` e `all`.
- A limpeza de inicialização é conduzida por concessões, não por varreduras amplas de strings de comando.
- Os testes focados de matriz de processos e visibilidade cobrem todos os casos de borda que antes exigiam correções pontuais de revisão.
