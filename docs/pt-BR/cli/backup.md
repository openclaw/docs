---
read_when:
    - Você quer um arquivo de backup de primeira classe para o estado local do OpenClaw
    - Você quer visualizar quais caminhos seriam incluídos antes de redefinir ou desinstalar
summary: Referência da CLI para `openclaw backup` (criar arquivos de backup locais)
title: Backup
x-i18n:
    generated_at: "2026-07-12T14:59:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b40206e74b43edd6c1d2b00de3cbe9fcfa053bfbb2ffdff0323fb8c1671c28ea
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Crie um arquivo de backup local para o estado, a configuração, os perfis de autenticação, as credenciais de canais/provedores, as sessões e, opcionalmente, os espaços de trabalho do OpenClaw.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T08-00-00.000+08-00-openclaw-backup.tar.gz
```

## Observações

- O arquivo inclui um `manifest.json` com os caminhos de origem resolvidos e a estrutura do arquivo.
- Por padrão, a saída é um arquivo `.tar.gz` com registro de data e hora no diretório de trabalho atual. Os nomes de arquivo com registro de data e hora usam o fuso horário local da sua máquina e incluem o deslocamento em relação ao UTC. Se o diretório de trabalho atual estiver dentro de uma árvore de origem incluída no backup, o OpenClaw usará seu diretório pessoal como local padrão do arquivo.
- Arquivos existentes nunca são sobrescritos. Caminhos de saída dentro das árvores de estado/espaço de trabalho de origem são rejeitados para evitar a inclusão do próprio backup.
- `openclaw backup verify <archive>` verifica se o arquivo contém exatamente um manifesto raiz, rejeita caminhos de arquivo no estilo de travessia de diretórios e arquivos auxiliares do SQLite, confirma a existência de cada conteúdo declarado no manifesto, valida a estrutura de cada snapshot do SQLite e executa verificações completas de integridade e função nos bancos de dados canônicos do OpenClaw. Os esquemas dedicados de plugins permanecem opacos porque podem exigir recursos do SQLite definidos pelo proprietário. `openclaw backup create --verify` executa essa validação imediatamente após gravar o arquivo.
- `openclaw backup create --only-config` faz backup apenas do arquivo de configuração JSON ativo.

## O que é incluído no backup

`openclaw backup create` planeja as origens com base na instalação local do OpenClaw:

- O diretório de estado (geralmente `~/.openclaw`)
- O caminho do arquivo de configuração ativo
- O diretório `credentials/` resolvido, quando ele existe fora do diretório de estado
- Os diretórios de espaços de trabalho descobertos com base na configuração atual, a menos que você use `--no-include-workspace`

Os perfis de autenticação e outros estados de execução por agente ficam no SQLite, dentro do diretório de estado (`agents/<agentId>/agent/openclaw-agent.sqlite`), portanto são incluídos automaticamente pela entrada de backup do estado.

`--only-config` ignora a descoberta do estado, do diretório de credenciais e dos espaços de trabalho, arquivando somente o caminho do arquivo de configuração ativo.

O OpenClaw canonicaliza os caminhos antes de criar o arquivo: se a configuração, o diretório de credenciais ou um espaço de trabalho já estiverem dentro do diretório de estado, eles não serão duplicados como origens de backup separadas no nível superior. Caminhos ausentes são ignorados.

Durante a criação do arquivo, o OpenClaw ignora arquivos conhecidos sujeitos a alterações em tempo real que não têm valor para restauração: transcrições de sessões ativas de agentes, logs de execuções Cron, logs rotativos, filas de entrega, arquivos de socket/pid/temporários no diretório de estado e arquivos temporários relacionados a filas duráveis. O campo `skippedVolatileCount` do resultado JSON informa quantos arquivos foram omitidos intencionalmente. Os bancos de dados SQLite no diretório de estado são compactados com `VACUUM INTO` para que resíduos de páginas excluídas não sejam incluídos no arquivo, e os arquivos WAL/SHM ativos não são copiados. Um banco de dados pertencente a um plugin que exija recursos indisponíveis do SQLite definidos pelo proprietário falha de forma segura, em vez de recorrer a uma cópia bruta das páginas. Os arquivos SQLite incluídos por meio de backups de espaços de trabalho são copiados como arquivos do espaço de trabalho e não são abrangidos pela garantia de compactação.

Os arquivos de código-fonte e manifesto dos plugins instalados na árvore `extensions/` do diretório de estado são incluídos, mas suas árvores de dependências `node_modules/` aninhadas são ignoradas por serem artefatos de instalação que podem ser recriados. Após restaurar um arquivo, use `openclaw plugins update <id>` ou reinstale com `openclaw plugins install <spec> --force` se um plugin restaurado indicar dependências ausentes.

## Comportamento com configuração inválida

`openclaw backup` ignora a verificação preliminar normal da configuração para continuar sendo útil durante a recuperação. A descoberta dos espaços de trabalho depende de uma configuração válida; portanto, `openclaw backup create` falha imediatamente quando o arquivo de configuração existe, mas é inválido, e o backup dos espaços de trabalho ainda está ativado.

Para fazer um backup parcial nessa situação, execute novamente com `--no-include-workspace`: isso mantém o estado, a configuração e o diretório externo de credenciais no escopo, enquanto ignora completamente a descoberta dos espaços de trabalho.

`--only-config` também funciona quando a configuração está malformada, pois não analisa a configuração para descobrir os espaços de trabalho.

## Tamanho e desempenho

O OpenClaw não impõe um tamanho máximo de backup integrado nem um limite de tamanho por arquivo. Os limites práticos são determinados por:

- Espaço disponível para a gravação temporária do arquivo e para o arquivo final
- Tempo necessário para percorrer grandes árvores de espaços de trabalho e compactá-las em um `.tar.gz`
- Tempo necessário para verificar novamente o arquivo com `--verify` ou `openclaw backup verify`
- Comportamento do sistema de arquivos de destino: o OpenClaw prefere uma etapa de publicação por link físico sem sobrescrita e recorre à cópia exclusiva quando links físicos não são compatíveis

Espaços de trabalho grandes geralmente são o principal fator no tamanho do arquivo. Use `--no-include-workspace` para obter um backup menor e mais rápido ou `--only-config` para gerar o menor arquivo possível.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
