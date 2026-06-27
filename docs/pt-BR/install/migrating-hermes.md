---
read_when:
    - Você vem do Hermes e quer manter sua configuração de modelo, prompts, memória e Skills
    - Você quer saber o que o OpenClaw importa automaticamente e o que permanece apenas no arquivo
    - Você precisa de um caminho de migração limpo e baseado em scripts (CI, laptop novo, automação)
summary: Migre do Hermes para o OpenClaw com uma importação pré-visualizada e reversível
title: Migrando do Hermes
x-i18n:
    generated_at: "2026-06-27T17:38:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f2a2bfea4fd276e3392261e8ecea09d147424636efb200ced1deb86ac0161b5
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw importa o estado do Hermes por meio de um provedor de migração incluído. O provedor pré-visualiza tudo antes de alterar o estado, oculta segredos em planos e relatórios e cria um backup verificado antes de aplicar.

<Note>
As importações exigem uma configuração nova do OpenClaw. Se você já tiver estado local do OpenClaw, redefina primeiro a configuração, as credenciais, as sessões e o workspace, ou use `openclaw migrate` diretamente com `--overwrite` depois de revisar o plano.
</Note>

## Duas maneiras de importar

<Tabs>
  <Tab title="Assistente de onboarding">
    O caminho mais rápido. O assistente detecta o Hermes em `~/.hermes` e mostra uma prévia antes de aplicar.

    ```bash
    openclaw onboard --flow import
    ```

    Ou aponte para uma origem específica:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    Use `openclaw migrate` para execuções automatizadas ou repetíveis. Consulte [`openclaw migrate`](/pt-BR/cli/migrate) para a referência completa.

    ```bash
    openclaw migrate hermes --dry-run    # somente prévia
    openclaw migrate apply hermes --yes  # aplicar pulando a confirmação
    ```

    Adicione `--from <path>` quando o Hermes estiver fora de `~/.hermes`.

  </Tab>
</Tabs>

## O que é importado

<AccordionGroup>
  <Accordion title="Configuração de modelo">
    - Seleção de modelo padrão a partir de `config.yaml` do Hermes.
    - Provedores de modelo configurados e endpoints personalizados compatíveis com OpenAI a partir de `providers` e `custom_providers`.

  </Accordion>
  <Accordion title="Servidores MCP">
    Definições de servidores MCP de `mcp_servers` ou `mcp.servers`.
  </Accordion>
  <Accordion title="Arquivos do workspace">
    - `SOUL.md` e `AGENTS.md` são copiados para o workspace do agente OpenClaw.
    - `memories/MEMORY.md` e `memories/USER.md` são **anexados** aos arquivos de memória correspondentes do OpenClaw em vez de sobrescrevê-los.

  </Accordion>
  <Accordion title="Configuração de memória">
    Padrões de configuração de memória para a memória em arquivo do OpenClaw. Provedores de memória externos, como Honcho, são registrados como itens de arquivo ou de revisão manual para que você possa movê-los deliberadamente.
  </Accordion>
  <Accordion title="Skills">
    Skills com um arquivo `SKILL.md` em `skills/<name>/` são copiadas, junto com valores de configuração por Skill de `skills.config`.
  </Accordion>
  <Accordion title="Credenciais de autenticação">
    O `openclaw migrate` interativo pergunta antes de importar credenciais de autenticação, com sim selecionado por padrão. As importações aceitas incluem credenciais OAuth da OpenAI do OpenCode a partir de `auth.json` do OpenCode, entradas do OpenCode e GitHub Copilot a partir de `auth.json` do OpenCode e as [chaves `.env` compatíveis](/pt-BR/cli/migrate#supported-env-keys). Entradas OAuth de `auth.json` do Hermes são estado legado e aparecem como trabalho manual de reautenticação/doctor em vez de serem importadas para a autenticação ativa. Use `--include-secrets` para importação não interativa de credenciais com `openclaw migrate`, `--no-auth-credentials` para ignorá-la, ou `--import-secrets` no onboarding ao importar pelo assistente de onboarding.
  </Accordion>
</AccordionGroup>

## O que permanece somente no arquivo

O provedor copia estes itens para o diretório do relatório de migração para revisão manual, mas **não** os carrega na configuração ou nas credenciais ativas do OpenClaw:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

O OpenClaw se recusa a executar ou confiar automaticamente nesse estado porque os formatos e as premissas de confiança podem divergir entre sistemas. Mova manualmente o que precisar depois de revisar o arquivo.

## Fluxo recomendado

<Steps>
  <Step title="Pré-visualizar o plano">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    O plano lista tudo que será alterado, incluindo conflitos, itens ignorados e quaisquer itens sensíveis. A saída do plano oculta chaves aninhadas que parecem conter segredos.

  </Step>
  <Step title="Aplicar com backup">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    O OpenClaw cria e verifica um backup antes de aplicar. Este exemplo não interativo importa estado sem segredos. Execute sem `--yes` para responder ao prompt de credenciais, ou adicione `--include-secrets` para incluir credenciais compatíveis em execuções sem intervenção.

  </Step>
  <Step title="Executar doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/pt-BR/gateway/doctor) reaplica quaisquer migrações de configuração pendentes e verifica problemas introduzidos durante a importação.

  </Step>
  <Step title="Reiniciar e verificar">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Confirme que o gateway está saudável e que seu modelo, memória e Skills importados foram carregados.

  </Step>
</Steps>

## Tratamento de conflitos

A aplicação se recusa a continuar quando o plano relata conflitos (um arquivo ou valor de configuração já existe no destino).

<Warning>
Execute novamente com `--overwrite` somente quando substituir o destino existente for intencional. Os provedores ainda podem gravar backups por item para arquivos sobrescritos no diretório do relatório de migração.
</Warning>

Em uma instalação nova do OpenClaw, conflitos são incomuns. Eles normalmente aparecem quando você executa a importação novamente em uma configuração que já tem edições do usuário.

Se um conflito surgir no meio da aplicação (por exemplo, uma corrida inesperada em um arquivo de configuração), o Hermes marca os itens de configuração dependentes restantes como `skipped` com o motivo `blocked by earlier apply conflict` em vez de gravá-los parcialmente. O relatório de migração registra cada item bloqueado para que você possa resolver o conflito original e executar a importação novamente.

## Segredos

O `openclaw migrate` interativo pergunta se deve importar credenciais de autenticação detectadas, com sim selecionado por padrão.

- Aceitar o prompt importa credenciais OAuth da OpenAI do OpenCode a partir de `auth.json` do OpenCode, entradas do OpenCode e GitHub Copilot a partir de `auth.json` do OpenCode e as [chaves `.env` compatíveis](/pt-BR/cli/migrate#supported-env-keys). Entradas OAuth de `auth.json` do Hermes são relatadas para reautenticação manual da OpenAI ou reparo por doctor.
- Use `--no-auth-credentials` ou escolha não no prompt para importar apenas estado sem segredos.
- Use `--include-secrets` ao executar sem intervenção com `--yes`.
- Use `--import-secrets` no onboarding ao importar credenciais pelo assistente de onboarding.
- Para credenciais gerenciadas por SecretRef, configure a origem do SecretRef depois que a importação for concluída.

## Saída JSON para automação

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Com `--json` e sem `--yes`, apply imprime o plano e não altera o estado. Este é o modo mais seguro para CI e scripts compartilhados.

## Solução de problemas

<AccordionGroup>
  <Accordion title="Apply recusa com conflitos">
    Inspecione a saída do plano. Cada conflito identifica o caminho de origem e o destino existente. Decida por item se deve ignorar, editar o destino ou executar novamente com `--overwrite`.
  </Accordion>
  <Accordion title="O Hermes fica fora de ~/.hermes">
    Passe `--from /actual/path` (CLI) ou `--import-source /actual/path` (onboarding).
  </Accordion>
  <Accordion title="O onboarding se recusa a importar em uma configuração existente">
    Importações por onboarding exigem uma configuração nova. Redefina o estado e refaça o onboarding, ou use `openclaw migrate apply hermes` diretamente, que aceita `--overwrite` e controle explícito de backup.
  </Accordion>
  <Accordion title="As chaves de API não foram importadas">
    O `openclaw migrate` interativo importa chaves de API somente quando você aceita o prompt de credenciais. Execuções não interativas com `--yes` exigem `--include-secrets`; importações por onboarding exigem `--import-secrets`. Somente as [chaves `.env` compatíveis](/pt-BR/cli/migrate#supported-env-keys) são reconhecidas; outras variáveis em `.env` são ignoradas.
  </Accordion>
</AccordionGroup>

## Relacionados

- [`openclaw migrate`](/pt-BR/cli/migrate): referência completa da CLI, contrato de Plugin e formatos JSON.
- [Onboarding](/pt-BR/cli/onboard): fluxo do assistente e flags não interativas.
- [Migração](/pt-BR/install/migrating): mover uma instalação do OpenClaw entre máquinas.
- [Doctor](/pt-BR/gateway/doctor): verificação de integridade pós-migração.
- [Workspace do agente](/pt-BR/concepts/agent-workspace): onde ficam `SOUL.md`, `AGENTS.md` e arquivos de memória.
