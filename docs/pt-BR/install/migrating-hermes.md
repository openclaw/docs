---
read_when:
    - Você está migrando do Hermes e quer manter a configuração dos seus modelos, prompts, memória e skills
    - Você quer saber o que o OpenClaw importa automaticamente e o que permanece apenas no arquivo morto
    - Você precisa de um caminho de migração limpo e baseado em scripts (CI, notebook novo, automação)
summary: Migre do Hermes para o OpenClaw com uma importação pré-visualizada e reversível
title: Migrando do Hermes
x-i18n:
    generated_at: "2026-07-12T15:18:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: dd9012efb084c00dfe55bb841fea3cc6908c08b528492f1552bf226f125961e6
    source_path: install/migrating-hermes.md
    workflow: 16
---

O provedor de migração Hermes incluído detecta o estado em `~/.hermes`, mostra uma prévia de cada alteração antes da aplicação, oculta segredos nos planos e relatórios e grava um backup verificado do OpenClaw antes de modificar qualquer coisa.

<Note>
As importações exigem uma configuração nova do OpenClaw. Se você já tiver estado local do OpenClaw, redefina primeiro a configuração, as credenciais, as sessões e o espaço de trabalho ou use `openclaw migrate apply hermes` diretamente com `--overwrite` após revisar o plano.
</Note>

## Duas maneiras de importar

<Tabs>
  <Tab title="Assistente de integração">
    Detecta o Hermes em `~/.hermes` e mostra uma prévia antes da aplicação.

    ```bash
    openclaw onboard --flow import
    ```

    Ou indique uma origem específica:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    Use `openclaw migrate` para execuções automatizadas ou repetíveis. Consulte [`openclaw migrate`](/pt-BR/cli/migrate) para ver a referência completa.

    ```bash
    openclaw migrate hermes --dry-run    # somente prévia
    openclaw migrate apply hermes --yes  # aplica sem solicitar confirmação
    ```

    Adicione `--from <path>` quando o Hermes estiver fora de `~/.hermes`.

  </Tab>
</Tabs>

## O que é importado

<AccordionGroup>
  <Accordion title="Configuração do modelo">
    - Seleção do modelo padrão no `config.yaml` do Hermes.
    - Provedores de modelos configurados e endpoints personalizados compatíveis com a OpenAI em `providers` e `custom_providers`.

  </Accordion>
  <Accordion title="Servidores MCP">
    Definições de servidores MCP em `mcp_servers` ou `mcp.servers`.
  </Accordion>
  <Accordion title="Arquivos do espaço de trabalho">
    - `SOUL.md` e `AGENTS.md` são copiados para o espaço de trabalho do agente do OpenClaw.
    - `memories/MEMORY.md` e `memories/USER.md` são **acrescentados** aos arquivos de memória correspondentes do OpenClaw, em vez de substituí-los.

  </Accordion>
  <Accordion title="Configuração da memória">
    Configuração padrão da memória baseada em arquivos do OpenClaw. Provedores de memória externos, como o Honcho, são registrados como itens de arquivo ou de revisão manual para que você possa migrá-los deliberadamente.
  </Accordion>
  <Accordion title="Skills">
    Skills com um arquivo `SKILL.md` em `skills/<name>/` são copiadas junto com os valores de configuração específicos de cada Skill em `skills.config`.
  </Accordion>
  <Accordion title="Credenciais de autenticação">
    O `openclaw migrate` interativo solicita confirmação antes de importar credenciais de autenticação, com sim selecionado por padrão. Ao aceitar, são importadas as entradas de OAuth da OpenAI no OpenCode e do GitHub Copilot do `auth.json` do OpenCode, além das [chaves `.env` compatíveis do Hermes](/pt-BR/cli/migrate#supported-env-keys). As entradas de OAuth do próprio `auth.json` do Hermes são estado legado: elas aparecem como um item de reautenticação manual ou do doctor, em vez de serem importadas para a autenticação ativa. Use `--include-secrets` para importar credenciais em uma execução não interativa, `--no-auth-credentials` para ignorar totalmente a importação de credenciais ou a opção `--import-secrets` do assistente de integração.
  </Accordion>
</AccordionGroup>

## O que permanece somente no arquivo

O provedor copia os itens a seguir para o diretório do relatório de migração para revisão manual, mas **não** os carrega na configuração nem nas credenciais ativas do OpenClaw:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

O OpenClaw se recusa a executar ou confiar automaticamente nesse estado porque os formatos e pressupostos de confiança podem divergir entre os sistemas. Após revisar o arquivo, mova manualmente o que for necessário.

## Fluxo recomendado

<Steps>
  <Step title="Visualizar o plano">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    O plano relaciona tudo o que será alterado, incluindo conflitos, itens ignorados e itens confidenciais. Chaves aninhadas que parecem conter segredos são ocultadas na saída.

  </Step>
  <Step title="Aplicar com backup">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    O OpenClaw cria e verifica um backup antes da aplicação. Este exemplo não interativo importa somente o estado não confidencial. Execute sem `--yes` para responder interativamente à solicitação de credenciais ou adicione `--include-secrets` para incluir as credenciais compatíveis em uma execução sem supervisão.

  </Step>
  <Step title="Executar o doctor">
    ```bash
    openclaw doctor
    ```

    O [Doctor](/pt-BR/gateway/doctor) reaplica todas as migrações de configuração pendentes e verifica problemas introduzidos durante a importação.

  </Step>
  <Step title="Reiniciar e verificar">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Confirme se o Gateway está íntegro e se o modelo, a memória e as Skills importados estão carregados.

  </Step>
</Steps>

## Tratamento de conflitos

A aplicação se recusa a continuar quando o plano relata conflitos (um arquivo ou valor de configuração já existe no destino).

<Warning>
Execute novamente com `--overwrite` somente quando a substituição do destino existente for intencional. Os provedores ainda podem gravar backups individuais dos arquivos substituídos no diretório do relatório de migração.
</Warning>

Conflitos são incomuns em uma instalação nova. Eles normalmente aparecem quando você executa novamente a importação em uma configuração que já contém edições do usuário.

Se surgir um conflito durante a aplicação (por exemplo, uma condição de corrida inesperada em um arquivo de configuração), o Hermes marca os itens de configuração dependentes restantes como `skipped`, com o motivo `blocked by earlier apply conflict`, em vez de gravá-los parcialmente. O relatório de migração registra cada item bloqueado para que você possa resolver o conflito original e executar novamente a importação.

## Segredos

O `openclaw migrate` interativo pergunta se deve importar as credenciais de autenticação detectadas, com sim selecionado por padrão.

- Ao aceitar, são importadas as entradas de OAuth da OpenAI no OpenCode e do GitHub Copilot do `auth.json` do OpenCode, além das [chaves `.env` compatíveis](/pt-BR/cli/migrate#supported-env-keys). As entradas de OAuth do próprio `auth.json` do Hermes são relatadas para reautenticação manual na OpenAI ou correção pelo doctor.
- Use `--no-auth-credentials`, ou responda não à solicitação, para importar somente o estado não confidencial.
- Use `--include-secrets` para importar credenciais em uma execução `--yes` sem supervisão.
- Use a opção `--import-secrets` do assistente de integração para importar credenciais por meio dele.

## Saída JSON para automação

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Com `--json` e sem `--yes`, a aplicação exibe o plano e não modifica o estado — o modo mais seguro para CI e scripts compartilhados.

## Solução de problemas

<AccordionGroup>
  <Accordion title="A aplicação é recusada devido a conflitos">
    Examine a saída do plano. Cada conflito identifica o caminho de origem e o destino existente. Decida, para cada item, se deseja ignorá-lo, editar o destino ou executar novamente com `--overwrite`.
  </Accordion>
  <Accordion title="O Hermes está fora de ~/.hermes">
    Passe `--from /actual/path` (CLI) ou `--import-source /actual/path` (integração).
  </Accordion>
  <Accordion title="A integração se recusa a importar em uma configuração existente">
    As importações pela integração exigem uma configuração nova. Redefina o estado e execute novamente a integração ou use `openclaw migrate apply hermes` diretamente, que aceita `--overwrite` e controle explícito do backup.
  </Accordion>
  <Accordion title="As chaves de API não foram importadas">
    O `openclaw migrate` interativo importa chaves de API somente quando você aceita a solicitação de credenciais. Execuções não interativas com `--yes` precisam de `--include-secrets`; importações pela integração precisam de `--import-secrets`. Somente as [chaves `.env` compatíveis](/pt-BR/cli/migrate#supported-env-keys) são reconhecidas — outras variáveis de `.env` são ignoradas.
  </Accordion>
</AccordionGroup>

## Relacionados

- [`openclaw migrate`](/pt-BR/cli/migrate): referência completa da CLI, contrato de Plugin e formatos JSON.
- [Integração](/pt-BR/cli/onboard): fluxo do assistente e opções não interativas.
- [Migração](/pt-BR/install/migrating): mova uma instalação do OpenClaw entre máquinas.
- [Doctor](/pt-BR/gateway/doctor): verificação de integridade após a migração.
- [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace): onde ficam `SOUL.md`, `AGENTS.md` e os arquivos de memória.
