---
read_when:
    - Você quer que o OpenClaw aprenda procedimentos reutilizáveis com conversas concluídas
    - Você está decidindo se deve habilitar propostas autônomas de Skills
    - Você precisa entender a segurança, o custo, a elegibilidade ou a solução de problemas do autoaprendizado
sidebarTitle: Self-learning
summary: Permita que o OpenClaw proponha Skills reutilizáveis com base em correções e trabalhos substanciais concluídos
title: Autoaprendizado
x-i18n:
    generated_at: "2026-07-16T13:03:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b10618c1a64441bdf0ba58f03e02972bdf2b1d59643a78358910594f8139ccb8
    source_path: tools/self-learning.md
    workflow: 16
---

O autoaprendizado permite que o OpenClaw transforme evidências úteis de conversas em propostas pendentes do
[Skill Workshop](/pt-BR/tools/skill-workshop). Ele não treina os pesos do modelo,
edita Skills ativas nem altera silenciosamente o comportamento do agente. Todo
procedimento aprendido permanece pendente até que um operador o revise e aplique.

O autoaprendizado é **desativado por padrão**. Ative-o somente quando uma
execução adicional do modelo em segundo plano e a revisão da transcrição forem apropriadas para seu espaço de trabalho.

## Ativar o autoaprendizado

Na UI de Controle, abra **Plugins → Workshop** e ative **Autoaprendizado**. A
alteração entra em vigor imediatamente; quando outro gravador de configuração tiver atualizado o
arquivo, a UI de Controle atualizará o snapshot da configuração e tentará alternar a opção novamente sem
recarregar a página nem o Gateway.

Use a CLI:

```bash
openclaw config set skills.workshop.autonomous.enabled true --strict-json
```

Ou edite `~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: true,
      },
    },
  },
}
```

Desative-o novamente com:

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

A criação de Skills solicitada pelo usuário, `/learn` e as operações manuais do Skill Workshop
continuam funcionando enquanto o autoaprendizado está desativado.

## Revisar sessões anteriores manualmente

A revisão manual do histórico é a alternativa conservadora à captura autônoma.
Abra **Plugins → Workshop** na UI de Controle e selecione **Encontrar ideias de Skills**.
Isso não altera `skills.workshop.autonomous.enabled`.

Cada varredura:

- começa pelas sessões não revisadas mais recentes e retrocede;
- revisa até 20 sessões substanciais com pelo menos seis turnos do modelo;
- ignora sessões de cron, Heartbeat, hook, subagente, ACP, pertencentes a plugins e de revisão
  interna;
- oculta segredos reconhecidos e limita o pacote de transcrições antes de enviá-lo
  ao modelo configurado do agente selecionado;
- usa o mesmo nível de exigência elevado da revisão autônoma de experiências; e
- pode criar ou revisar no máximo três propostas pendentes, nunca Skills ativas.

O Workshop informa a contagem cumulativa de sessões, a cobertura de datas e as ideias encontradas.
Selecione **Examinar trabalhos anteriores** para acessar a próxima janela mais antiga. Quando o cursor chega
ao início do histórico elegível, a ação muda para **Examinar novos trabalhos**.
O OpenClaw mantém apenas os metadados de cursor e cobertura no banco de dados de estado compartilhado;
ele não cria um segundo arquivo de transcrições.

As sessões são examinadas somente quando o OpenClaw consegue comprovar a propriedade delas e excluir
conteúdo de hooks externos. Após uma atualização, a transcrição atual anterior à atualização pode
ser classificada localmente, mas as transcrições rotacionadas anteriores à atualização sem proveniência
por execução são ignoradas. As novas transcrições mantêm essa proveniência após a rotação.

As varreduras manuais ainda geram custos do provedor do modelo e enviam o conteúdo elegível das conversas
ao provedor configurado. Use-as somente quando essa revisão estiver de acordo com os
requisitos de privacidade e tratamento de dados do espaço de trabalho.

## O que o OpenClaw pode aprender

O autoaprendizado tem dois caminhos conservadores:

1. **Instruções diretas e correções.** O OpenClaw detecta linguagem duradoura
   como “de agora em diante”, “da próxima vez” e correções de uma abordagem que falhou.
   Com o autoaprendizado ativado, ele pode transformar esses sinais em propostas pendentes
   sem aguardar outro prompt. Esse caminho determinístico pode agrupar instruções relacionadas
   em até três propostas, direcionar uma Skill gravável do espaço de trabalho
   ou revisar sua própria proposta pendente relacionada. Ele também é executado após turnos com falha,
   pois captura as instruções do usuário em vez de avaliar a conclusão.
2. **Revisão de experiência.** Após um turno em primeiro plano bem-sucedido e substancial,
   o OpenClaw pode revisar o trabalho concluído em busca de uma técnica de recuperação reutilizável ou
   de um procedimento estável que eliminaria pelo menos duas futuras idas e vindas
   do modelo ou das ferramentas.

Bons candidatos incluem:

- uma recuperação confiável após falhas repetidas de ferramentas ou do modelo;
- uma restrição de ordem não óbvia que impediu um erro recorrente;
- um fluxo de trabalho estável de várias etapas que exigiu descobertas repetidas; ou
- uma verificação preliminar reutilizável que evitaria várias chamadas futuras.

O revisor deve se abster no caso de trabalho rotineiro bem-sucedido, solicitações pontuais,
fatos pessoais, preferências simples, falhas transitórias do ambiente, orientações
genéricas, alegações negativas sem fundamento e segredos.

## Quando a revisão de experiência é executada

A revisão de experiência é deliberadamente adiada e limitada:

- O turno em primeiro plano deve ser concluído com sucesso.
- O turno atual deve conter pelo menos dez iterações do modelo.
- Sessões de Cron, Heartbeat, memória, overflow, hook, subagente e revisão são
  excluídas.
- A execução em primeiro plano deve ter resolvido um provedor e um modelo e deve realmente
  ter tido acesso a `skill_workshop`.
- O OpenClaw aguarda 30 segundos após a conclusão. Uma conclusão posterior em primeiro plano na
  mesma sessão reinicia esse período de inatividade.
- Se alguma execução de agente ou resposta ainda estiver ativa, a revisão aguardará mais 30 segundos.
- Somente uma revisão de experiência é executada por vez.
- A revisão adiada é um trabalho do Gateway local ao processo. O Gateway deve permanecer em execução
  durante a janela de inatividade; runtimes locais de execução única e baseados em CLI não mantêm
  contexto suficiente da trajetória e da disponibilidade das ferramentas para agendá-la.

A resposta em primeiro plano nunca é atrasada para fins de aprendizado. Um turno com falha ou inelegível
não inicia a revisão de experiência, embora correções diretas do usuário ainda possam
ser oferecidas como sugestão quando a autonomia estiver desativada.

## O que o revisor recebe

O revisor em segundo plano recebe somente o turno atual, começando pela mensagem mais
recente do usuário. A trajetória renderizada é limitada a 60.000 caracteres;
quando necessário, o OpenClaw mantém a primeira mensagem e as evidências mais recentes e
marca a parte intermediária omitida.

O revisor reutiliza o provedor e o modelo resolvidos. Ele reutiliza o perfil de
autenticação da execução em primeiro plano quando essa identidade está disponível e desativa fallbacks do modelo. Portanto, a
revisão inicia uma execução adicional do modelo no provedor configurado.
Essa execução pode fazer mais de uma solicitação ao provedor ao inspecionar ou elaborar uma
proposta. Os preços e termos de tratamento de dados do provedor se aplicam da mesma forma que ao
turno em primeiro plano.

Antes de iniciar, o OpenClaw recarrega a configuração atual do runtime e verifica novamente a
política efetiva de sandbox e ferramentas da conversa original. Se a execução estiver
em sandbox, se a política não permitir mais `skill_workshop` ou se fatos necessários do runtime
estiverem ausentes, a revisão falhará de forma segura e não criará nada.

<Warning>
  Ativar o autoaprendizado permite que o conteúdo elegível da conversa, incluindo entradas
  e resultados de ferramentas do turno atual, seja enviado ao provedor do modelo selecionado
  para uma revisão adicional. Não o ative em um espaço de trabalho em que
  essa revisão violaria os requisitos de tratamento de dados.
</Warning>

## Segurança das propostas

O revisor é executado em uma sessão isolada com uma superfície de ferramentas deliberadamente
restrita:

- Ele só pode listar ou inspecionar propostas do Workshop e criar ou revisar uma
  proposta pendente.
- Ele não pode atualizar uma Skill ativa, aplicar uma proposta, rejeitar uma proposta, colocar
  uma proposta em quarentena, enviar uma mensagem nem usar ferramentas gerais do agente.
- Um orçamento de mutação é compartilhado entre as novas tentativas do modelo, portanto uma revisão pode criar ou
  revisar no máximo uma proposta.
- A trajetória revisada é tratada como evidência não confiável, e não como instruções
  para o agente em segundo plano.
- O Skill Workshop examina o conteúdo da proposta e rejeita credenciais literais
  reconhecidas antes de gravar o estado da proposta.

Os limites normais do Workshop continuam válidos, incluindo `maxPending`, `maxSkillBytes`,
restrições de arquivos de suporte, verificações do scanner e gravações somente no espaço de trabalho. A
configuração `approvalPolicy: "auto"` não concede ao revisor em segundo plano acesso
a ações de ciclo de vida.

## Revisar propostas aprendidas

O autoaprendizado produz as mesmas propostas pendentes que o uso manual do Workshop.
Inspecione-as antes de aplicar:

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Revise, rejeite ou coloque em quarentena propostas que sejam úteis, mas ainda não estejam prontas:

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop reject <proposal-id> --reason "Too specific"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

Aplicar é a única operação que grava uma `SKILL.md` ativa. Consulte
[Skill Workshop](/pt-BR/tools/skill-workshop) para conhecer o ciclo de vida completo e o modelo
de armazenamento.

## Configuração

| Configuração                                | Padrão   | Efeito do autoaprendizado                                                                                                         |
| ------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `skills.workshop.autonomous.enabled`       | `false`  | Ativa a captura direta de correções e a revisão adiada de experiências.                                                           |
| `skills.workshop.approvalPolicy`           | `"auto"` | Controla os prompts de aprovação para ações normais de ciclo de vida iniciadas pelo agente; não amplia as permissões do revisor em segundo plano. |
| `skills.workshop.maxPending`               | `50`     | Limita as propostas pendentes e em quarentena por espaço de trabalho.                                                             |
| `skills.workshop.maxSkillBytes`            | `40000`  | Limita o tamanho do corpo da proposta em bytes.                                                                                   |
| `skills.workshop.allowSymlinkTargetWrites` | `false`  | Afeta somente o comportamento de aplicação; o próprio autoaprendizado grava o estado da proposta, não os destinos de Skills ativas. |

Para consultar o esquema completo, os intervalos e as configurações relacionadas a Skills, veja
[Configuração de Skills](/pt-BR/tools/skills-config#workshop-skills-workshop).

## Solução de problemas

### Nenhuma proposta aparece após um turno longo

Verifique todos os itens a seguir:

1. `skills.workshop.autonomous.enabled` é `true` na configuração ativa do Gateway.
2. O turno foi bem-sucedido e incluiu pelo menos dez iterações do modelo após a mensagem mais
   recente do usuário.
3. A conversa foi uma execução normal em primeiro plano, não uma execução agendada, de memória,
   hook ou subagente.
4. A execução original tinha acesso a `skill_workshop` e não estava em sandbox.
5. O sistema permaneceu inativo por tempo suficiente para a revisão adiada.
6. O processo de longa duração do Gateway permaneceu ativo durante a janela de inatividade; um
   comando local de execução única não aguarda a revisão adiada.

Uma revisão qualificada ainda pode não produzir nenhuma proposta. A abstenção é o resultado
esperado quando as evidências não atingem o nível exigido para um procedimento reutilizável.

### O Doctor informa que a ferramenta Workshop está oculta

Quando o autoaprendizado está ativado, `openclaw doctor` verifica se a política efetiva
de ferramentas do agente padrão permite `skill_workshop`. Siga a alteração de
`tools.allow` ou `tools.alsoAllow` informada, ou desative o autoaprendizado.

### Aparecem propostas de baixo valor em excesso

Desative o autoaprendizado e continue usando `/learn` ou solicitações explícitas do Workshop:

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

As propostas pendentes continuam disponíveis para revisão após a desativação do recurso. Desativar
o autoaprendizado não as aplica, rejeita nem exclui.

## Relacionado

- [Workshop de Skills](/pt-BR/tools/skill-workshop) para revisão, aprovação e
  armazenamento de propostas
- [Criação de skills](/pt-BR/tools/creating-skills) para skills criadas manualmente e
  a estrutura de `SKILL.md`
- [Configuração de Skills](/pt-BR/tools/skills-config) para todas as configurações de `skills.*`
- [CLI de Skills](/pt-BR/cli/skills) para comandos do Workshop e do curador
