---
read_when:
    - Você precisa de um registro durável do que o Gateway fez sem armazenar conteúdo
    - Você está decidindo se deve habilitar a auditoria do ciclo de vida das mensagens
    - Você precisa explicar o que os registros de auditoria comprovam e o que não comprovam
summary: Histórico de auditoria somente de metadados para execuções de agentes, ações de ferramentas e ciclos de vida de mensagens com adesão opcional
title: Histórico de auditoria
x-i18n:
    generated_at: "2026-07-12T15:13:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1005b214a674f0f888d759837bd627be458cefcf9ed61bda722499333361dc45
    source_path: gateway/audit.md
    workflow: 16
---

# Histórico de auditoria

O Gateway mantém um registro de auditoria limitado, contendo apenas metadados, no banco de dados de estado compartilhado do OpenClaw. Ele responde a perguntas operacionais como "qual agente foi executado, quando e como terminou", "quais ações de ferramentas uma execução realizou" e, quando a auditoria de mensagens está habilitada, "uma mensagem de entrada aceita chegou ao despacho" e "uma mensagem de saída chegou a um estado terminal de entrega".

O registro armazena identidade, ordenação, procedência, ação, status e códigos de resultado normalizados. Ele nunca armazena prompts, corpos de mensagens, argumentos de ferramentas, resultados de ferramentas, anexos, nomes de arquivos, URLs, saída de comandos nem texto bruto de erros.

## Famílias de registros

Os eventos de execução e de ferramentas são registrados sempre que a auditoria está habilitada (o padrão). Os eventos do ciclo de vida das mensagens são opcionais e ficam desabilitados por padrão.

| Família              | Ações                                                    | Padrão       |
| -------------------- | -------------------------------------------------------- | ------------ |
| Execuções de agentes | `agent.run.started`, `agent.run.finished`                | habilitado   |
| Ações de ferramentas | `tool.action.started`, `tool.action.finished`            | habilitado   |
| Mensagens            | `message.inbound.processed`, `message.outbound.finished` | desabilitado |

Cada registro contém um ID de evento estável, uma sequência monotônica do registro, um carimbo de data/hora do ciclo de vida, ator, ação, status, `schemaVersion: 1` e `redaction: "metadata_only"`. Consulte [Registros de auditoria](/pt-BR/cli/audit) para ver a referência completa dos campos e os filtros de consulta.

## Eventos do ciclo de vida das mensagens

Defina [`audit.messages`](/pt-BR/gateway/configuration-reference#audit) para escolher o que será registrado e reinicie o Gateway:

- `off` (padrão): nenhum registro de mensagem.
- `direct`: somente mensagens em conversas diretas.
- `all`: mensagens diretas, de grupos e de canais.

Dois limites autoritativos produzem registros de mensagens:

- As linhas de **entrada** são gravadas quando uma mensagem aceita chega ao despacho principal, incluindo resultados de processamento duplicados e terminais.
- As linhas de **saída** são gravadas quando a entrega durável compartilhada chega a um resultado terminal: enviada, suprimida, com falha ou um `unknown` explícito para envios ambíguos devido a falhas abruptas. Os resultados da recuperação da fila e da fila de mensagens mortas estão incluídos. Cada conteúdo original de resposta lógica recebe uma linha terminal; a divisão em partes e a distribuição entre adaptadores são agregadas em `resultCount`.

### Classificação do tipo de conversa

O modo `direct` é um limite de privacidade; portanto, uma mensagem só é classificada como conversa direta quando os fatos do destino comprovam isso: o caminho de envio declarou o tipo de conversa do destino ou a rota da sessão de entrega identifica exatamente o canal e o par aos quais a entrega está sendo feita. Sinais mais fracos, como o estado da política ou a conversa de origem, podem classificar uma mensagem como `group` (excluindo-a da coleta em `direct`), mas nunca podem alegar que ela é `direct`. As mensagens que não puderem ser comprovadas como diretas são classificadas como `unknown` e não são registradas no modo `direct`. Portanto, os canais que não declaram tipos de chat podem registrar menos linhas no modo `direct` do que no modo `all`.

## Modelo de privacidade

As linhas de mensagens nunca armazenam identificadores brutos da plataforma. Quando a correlação está disponível, os identificadores de conta, conversa, mensagem e destino são exportados somente como pseudônimos com chave, locais à instalação (`hmac-sha256:v1:<keyId>:<digest>`):

- A chave HMAC é gerada no primeiro uso, é separada por domínio para cada tipo de identificador e reside no mesmo banco de dados de estado que o registro.
- Os pseudônimos são estáveis dentro de uma instalação, portanto, as linhas referentes à mesma conversa podem ser correlacionadas sem revelar o identificador da plataforma.
- Isso é **correlação, não anonimização**: qualquer pessoa com acesso de leitura ao banco de dados de estado também tem acesso à chave e pode testar possíveis identificadores brutos em relação aos pseudônimos. As exportações por RPC e CLI nunca incluem a chave.
- Se o material da chave estiver ausente ou corrompido enquanto as linhas de mensagens forem mantidas, o Gateway falhará de forma fechada e descartará novos registros de mensagens, em vez de alternar silenciosamente para uma nova chave, o que dividiria a correlação.

Os registros de execução e de ferramentas mantêm `sessionKey` e `sessionId` para correlação; as chaves de sessão canônicas podem conter IDs de contas ou pares da plataforma. Os registros de mensagens omitem ambos intencionalmente.

As exportações de auditoria continuam sendo metadados operacionais confidenciais, mesmo sem conteúdo: horários, canais, resultados e pseudônimos estáveis podem correlacionar atividades. Proteja as exportações com os mesmos controles de acesso e práticas de retenção usados para outros registros operacionais.

## Cobertura e limites de comprovação

O registro opera em regime de melhor esforço e é deliberadamente limitado. Trate-o como evidência do que foi registrado, não como prova do que aconteceu:

- **A ausência de uma linha não prova nada.** Descartes de entrada anteriores à admissão, envios de processos da CLI sem um gravador do Gateway em execução e caminhos locais de plugins ou de envio direto que ignoram a entrega durável compartilhada não deixam registros.
- As gravações passam por um processo em segundo plano com capacidade limitada; uma falha desse processo ou a saturação da fila descarta registros e gera um aviso operacional.
- Envios de saída ambíguos devido a falhas abruptas são registrados como `unknown`, em vez de receberem resultados inventados.

Esse registro oferece suporte à depuração e à análise operacional. Ele não é um arquivo de conformidade sem perdas; se você precisar de um, use um sistema externo alimentado pelo [OpenTelemetry](/pt-BR/gateway/opentelemetry) ou por ferramentas no nível do canal.

## Armazenamento, retenção e migração

Os registros residem no banco de dados de estado compartilhado (`state/openclaw.sqlite`) e são gravados fora do caminho crítico de entrega. As consultas nunca retornam registros com mais de 30 dias, e o registro é limitado a 100.000 linhas; as linhas expiradas são removidas durante a inicialização, na manutenção realizada a cada hora e em gravações posteriores. A manutenção da retenção continua em execução mesmo quando a coleta está desabilitada.

A atualização de um Gateway com o registro anterior, restrito a execuções e ferramentas, migra o esquema automaticamente na inicialização (ou por meio de `openclaw doctor --fix`); as linhas existentes e suas sequências no registro são preservadas.

## Consultas

- CLI: [`openclaw audit`](/pt-BR/cli/audit), com filtros por agente, sessão, execução, tipo, status, direção, canal, limites de tempo e paginação por cursor.
- RPC do Gateway: `audit.activity.list` (requer `operator.read`) retorna a união versionada de eventos de atividade V1; o RPC `audit.list` distribuído permanece inalterado para clientes antigos de execuções e ferramentas. Consulte [Protocolo do Gateway](/pt-BR/gateway/protocol#audit-ledger-rpc).

## Relacionados

- [CLI de registros de auditoria](/pt-BR/cli/audit)
- [Referência de configuração](/pt-BR/gateway/configuration-reference#audit)
- [Protocolo do Gateway](/pt-BR/gateway/protocol#audit-ledger-rpc)
- [OpenTelemetry](/pt-BR/gateway/opentelemetry)
