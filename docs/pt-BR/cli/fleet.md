---
read_when:
    - Você hospeda vários domínios de confiança de locatários em uma única máquina
    - É necessário criar, inspecionar, atualizar ou remover células da frota
summary: Referência da CLI para provisionar e gerenciar células isoladas do OpenClaw por locatário
title: Frota
x-i18n:
    generated_at: "2026-07-16T12:20:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: be589500e4715541f175caf0d5135a96baee4874e64c60c8b6f188ff1f70bc9f
    source_path: cli/fleet.md
    workflow: 16
---

# `openclaw fleet`

`openclaw fleet` gerencia instâncias completas do OpenClaw chamadas **células**. Cada célula tem seu próprio Gateway, estado, credenciais, contas de canais, contêiner e porta do host acessível somente por loopback. Use uma célula para cada limite de confiança de locatário; não use um único Gateway compartilhado como limite multilocatário hostil.

O Fleet é **experimental**. Nomes de comandos, flags, formatos de saída e o perfil do contêiner podem mudar entre versões sem um período de descontinuação.

O Fleet é compatível com Docker e Podman. A imagem padrão é `ghcr.io/openclaw/openclaw:latest`.

O Fleet é testado em hosts Linux e macOS. Atualmente, hosts Windows não foram testados.

## Início rápido

```bash
openclaw fleet create acme
openclaw fleet status acme
openclaw fleet list
```

`fleet create` exibe uma única vez o token gerado do Gateway junto com a URL da célula. Armazene o token imediatamente e configure as contas de canais de cada locatário dentro da célula correspondente.

## IDs de locatário

Os IDs de locatário devem corresponder a:

```text
^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$
```

Isso permite de 1 a 40 letras minúsculas, dígitos e hífens internos. Um ID deve começar e terminar com uma letra ou um dígito. Letras maiúsculas, sublinhados, barras, pontos, espaços em branco e strings de travessia como `../acme` são rejeitados.

O ID passa a fazer parte do nome do contêiner: `openclaw-cell-<tenant>`.

## `fleet create`

Crie uma célula e inicie-a:

```bash
openclaw fleet create acme
```

Crie uma célula Podman em uma porta fixa sem iniciá-la:

```bash
openclaw fleet create acme \
  --runtime podman \
  --port 19125 \
  --no-start
```

Passe variáveis de ambiente específicas do locatário repetindo `--env`:

```bash
openclaw fleet create acme \
  --env TZ=America/Los_Angeles \
  --env OPENCLAW_DISABLE_BONJOUR=1
```

As chaves de ambiente usam letras, dígitos e sublinhados e não podem começar com um dígito. Os valores devem ocupar uma única linha, pois o Fleet os transmite por meio de um arquivo protegido de ambiente do runtime. O Fleet rejeita tentativas de substituir as variáveis gerenciadas de caminho do contêiner e de token do Gateway listadas em [Armazenamento e layout do contêiner](#storage-and-container-layout).

### Opções de criação

| Opção                    | Padrão                               | Descrição                                                                                    |
| ------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `--image <ref>`           | `ghcr.io/openclaw/openclaw:latest`    | Imagem do contêiner da célula.                                                                  |
| `--runtime <runtime>`     | `docker`                              | CLI de contêiner: `docker` ou `podman`.                                                           |
| `--port <number>`         | Alocada automaticamente a partir de `19100`  | Porta de loopback do host. Uma porta selecionada explicitamente não deve pertencer a outra célula registrada.    |
| `--memory <value>`        | `2g`                                  | Limite de memória do contêiner na sintaxe do Docker/Podman.                                                |
| `--cpus <value>`          | `2`                                   | Limite de CPU do contêiner.                                                                           |
| `--disk <size>`           | Nenhum                                  | Limita a camada gravável do contêiner quando o backend de armazenamento oferece suporte a cotas.                     |
| `--network <mode>`        | `bridge`                              | Modo de rede de saída: `bridge` ou `internal`.                                                 |
| `--pids-limit <number>`   | `512`                                 | Número máximo de processos no contêiner.                                                  |
| `--env <KEY=VALUE>`       | Nenhum                                  | Passa uma variável de ambiente para a célula. Repita para vários valores.                          |
| `--gateway-token <value>` | Token hexadecimal aleatório de 32 caracteres | Usa um token fornecido do Gateway em vez de gerar um. Consulte [Tratamento de tokens](#token-handling). |
| `--no-start`              | A célula é iniciada                           | Cria o contêiner sem iniciá-lo.                                                      |
| `--json`                  | Saída legível por humanos                 | Exibe uma saída legível por máquina.                                                                 |

A alocação automática seleciona a primeira porta não utilizada do registro igual ou superior a `19100`. O Fleet rejeita IDs de locatário duplicados e portas explícitas já atribuídas a outra célula.

As referências de imagem são passadas como um único argumento para o runtime do contêiner. Referências vazias e valores que começam com `-` são rejeitados para impedir que uma imagem seja interpretada como uma opção do Docker ou Podman.

O endpoint selecionado do Docker ou Podman deve ser local. Antes de reservar uma porta ou criar estado local, o Fleet rejeita contextos remotos do Docker, endpoints `DOCKER_HOST` e serviços remotos do Podman. Não há suporte para hosts de células remotos.

Quando o Fleet inicia uma nova célula, o comando de criação aguarda até cerca de um minuto para que o Gateway responda a `/healthz`. Se a célula não ficar íntegra, o Fleet mantém o contêiner e a linha do registro intactos para `fleet status`, `fleet logs` ou remoção explícita. `--no-start` ignora essa verificação de integridade. O token gerado do Gateway de uma nova célula não íntegra não é perdido — ele permanece no ambiente do contêiner (`docker|podman inspect`) e, como a célula ainda não atendeu a nenhum tráfego, usar `fleet rm --force` e depois fazer uma nova criação é sempre uma alternativa segura.

### Fixação por digest

Os comandos de criação e upgrade aceitam referências de imagem fixadas por digest, como `--image ghcr.io/openclaw/openclaw@sha256:<digest>`. O Fleet passa a referência da imagem sem alterações para o Docker ou Podman, permitindo que um operador mantenha uma célula com bytes de imagem imutáveis em vez de uma tag variável.

O resultado da criação inclui o ID do locatário, o nome do contêiner, a porta do host, o token do Gateway e a URL local. Mesmo na saída JSON, trate o resultado como contendo dados secretos, pois ele inclui o token.

### Limites de disco

`--disk` limita somente a camada gravável do contêiner. Os diretórios de estado e autenticação de cada locatário montados por vinculação continuam sendo armazenamento do host; use cotas de projeto do sistema de arquivos do host quando esses diretórios também precisarem de um limite rígido.

| Backend de runtime/armazenamento | Suporte a `--disk`                                                             |
| ----------------------- | ---------------------------------------------------------------------------- |
| Docker overlay2 no XFS  | Requer a opção de montagem `pquota` do XFS.                                      |
| Docker btrfs ou zfs     | Compatível por meio do driver de armazenamento.                                             |
| Podman overlay          | Requer armazenamento subjacente XFS.                                                |
| Outros backends          | A criação do contêiner falha com o erro do daemon e as orientações de backend do Fleet. |

### Política de saída

| Modo       | Docker                                                                                                | Podman                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `bridge`   | Compatível; o tráfego de saída é irrestrito por padrão.                                                | Compatível; o tráfego de saída é irrestrito por padrão.                              |
| `internal` | Rejeitado porque o Docker não preserva a porta publicada de loopback do Gateway em uma rede interna. | Compatível; o Gateway de loopback permanece publicado enquanto o tráfego de saída é bloqueado. |

Para o Docker, mantenha o modo bridge e aplique a política de saída com regras do firewall do host, como a cadeia `DOCKER-USER`.

## `fleet list`

Liste as células na ordem dos IDs de locatário:

```bash
openclaw fleet list
openclaw fleet ls
openclaw fleet list --json
```

A tabela contém:

| Coluna    | Significado                                                                                                                                                                                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant`  | ID do locatário.                                                                                                                                                                                                                                                                            |
| `state`   | Estado atual do contêiner obtido pela inspeção do Docker ou Podman. `unknown` significa que o runtime estava indisponível ou que existe um contêiner com o nome da célula, mas seus rótulos de propriedade do Fleet não correspondem ao registro (um sinal de colisão ou adulteração — inspecione-o manualmente antes de agir). |
| `port`    | Porta de loopback do host mapeada para o Gateway da célula.                                                                                                                                                                                                                                        |
| `image`   | Imagem registrada do contêiner.                                                                                                                                                                                                                                                             |
| `created` | Horário de criação da célula.                                                                                                                                                                                                                                                                   |

As linhas do registro permanecem visíveis quando o Docker ou Podman está indisponível; somente o estado atual passa a ser `unknown`.

## `fleet status`

Inspecione uma célula:

```bash
openclaw fleet status acme
openclaw fleet status acme --json
```

O status combina a linha do registro do Fleet, a inspeção atual do contêiner e uma breve solicitação de melhor esforço para:

```text
http://127.0.0.1:<host-port>/healthz
```

O resultado da verificação de integridade é `ok`, `failed` ou `skipped`. `/healthz` comprova que o Gateway está ativo, não que todos os canais ou plugins configurados estejam totalmente prontos. A sondagem é ignorada quando não há um endpoint local utilizável para verificar.

## `fleet logs`

Transmita os logs do contêiner de uma célula diretamente para o terminal:

```bash
openclaw fleet logs acme
openclaw fleet logs acme --follow
openclaw fleet logs acme --tail 200
openclaw fleet logs acme --since 10m
```

O Fleet verifica os rótulos de propriedade do contêiner registrado antes de ler qualquer log, recusando assim um contêiner externo que use o nome esperado da célula. O fluxo é fixado ao ID do contêiner inspecionado, portanto uma substituição simultânea não pode redirecioná-lo para uma geração mais recente. Pressione Ctrl-C para encerrar `--follow` sem tratar a interrupção pelo operador como uma falha do comando. A saída de log passa por um filtro de ocultação que substitui o token atual do Gateway da célula por `<redacted>` antes que qualquer conteúdo chegue ao terminal.

`fleet logs` não tem um modo `--json`, pois os logs do contêiner são um fluxo bruto de stdout/stderr. Para scripts, limite a saída com `--tail` e use redirecionamentos ou pipelines comuns do shell.

## `fleet start`, `fleet stop` e `fleet restart`

Controle uma célula existente com seu runtime registrado:

```bash
openclaw fleet start acme
openclaw fleet stop acme
openclaw fleet restart acme
```

Esses comandos operam no nome de contêiner registrado. Eles falham se o locatário for desconhecido ou se o runtime registrado não puder executar a operação.

## `fleet upgrade`

Baixe novamente a imagem registrada e substitua o contêiner da célula:

```bash
openclaw fleet upgrade acme
```

Mova a célula para outra imagem:

```bash
openclaw fleet upgrade acme --image ghcr.io/openclaw/openclaw:<version>
```

A atualização baixa a imagem de destino, inspeciona o contêiner existente e a rede por célula, interrompe e remove o contêiner e, em seguida, recria-o e o inicia. A substituição preserva a mesma porta do host, os diretórios de dados, a rede de bridge por célula, o perfil de runtime, os limites de recursos, a política de reinicialização, o ambiente gerenciado pelo Fleet e os valores originalmente fornecidos com `--env`. O estado montado sobrevive à substituição do contêiner; o ambiente padrão da imagem pode mudar de acordo com a imagem de destino.

A substituição só é confirmada depois que seu Gateway responde a `/healthz` na porta de loopback da célula, de acordo com o contrato de integridade usado pelo arquivo Compose oficial. Uma substituição que encerre, entre em um ciclo de falhas ou não fique íntegra em cerca de um minuto é removida, e o contêiner anterior é restaurado, para que uma imagem defeituosa não derrube uma célula em funcionamento.

O token do Gateway não é armazenado intencionalmente no registro do Fleet. Antes de remover o contêiner antigo, o Fleet lê seu ambiente e transfere `OPENCLAW_GATEWAY_TOKEN` para o substituto. Não remova manualmente o contêiner antigo antes de uma atualização se o token não existir em nenhum outro local sob seu controle.

## `fleet backup` e `fleet restore`

Faça backup de uma célula interrompida:

```bash
openclaw fleet stop acme
openclaw fleet backup acme --out ./acme.tgz
```

Restaure esse arquivo na célula registrada:

```bash
openclaw fleet restore acme --from ./acme.tgz
```

Esses são comandos privilegiados do operador do host. Os arquivos contêm o estado e os segredos de autenticação do locatário, são criados com o modo `0600` e devem ser armazenados como credenciais. O backup recusa uma célula em execução para que o estado do SQLite seja capturado de forma consistente. A restauração recusa uma célula em execução, a menos que `--force` seja fornecido, substitui apenas o estado desse locatário, alterna o token do Gateway e imprime o novo token uma única vez. O Fleet faz backup de um locatário por vez; o backup de todos os locatários é uma ação separada do operador.

A restauração precisa de um contêiner existente e interrompido, pois o perfil de runtime inspecionado dele fornece os limites, o mapeamento de usuário, a procedência do ambiente e a imagem para a substituição. Se o contêiner registrado tiver sido removido fora do Fleet, primeiro execute `fleet rm <tenant> --force` sem `--purge-data`, recrie a célula com a imagem pretendida e `--no-start` e tente restaurar novamente. A primeira remoção mantém intactos os dois diretórios de dados do locatário.

Ambos os comandos aceitam `--max-bytes <bytes>` para limitar os dados de arquivos arquivados ou extraídos, e ambos aplicam o mesmo orçamento fixo de um milhão de segmentos de caminho de arquivo, para que arquivos maliciosos compostos apenas por metadados não possam esgotar os inodes do host e para que todo backup aceito continue restaurável. O backup aceita `--out <path>`, e ambos os comandos oferecem suporte a `--json`.

Os arquivos contêm apenas arquivos comuns e diretórios. O backup nunca segue nem armazena links simbólicos, links físicos, soquetes ou nós de dispositivo; as contagens de itens ignorados são informadas no resultado. A restauração rejeita arquivos que contenham qualquer outro tipo de entrada. Árvores de links simbólicos recriáveis, como `node_modules` do espaço de trabalho, devem ser reinstaladas dentro da célula após uma restauração.

## `fleet doctor`

Audite todas as células ou um locatário sem alterar o estado do runtime ou do sistema de arquivos:

```bash
openclaw fleet doctor
openclaw fleet doctor acme --json
```

O Doctor verifica a localidade do runtime, os rótulos de propriedade, a integridade, o reforço de segurança, os limites de recursos, a vinculação da porta de loopback, a presença do token, a propriedade da rede e o modo de saída, além das permissões do diretório de estado privado. Os avisos descrevem células interrompidas ou diferenças de propriedade; qualquer constatação com falha define um código de saída de processo diferente de zero.

## `fleet rm`

Remova uma célula interrompida do runtime e do registro, mantendo os dados do locatário:

```bash
openclaw fleet rm acme
```

Um contêiner em execução exige `--force`:

```bash
openclaw fleet rm acme --force
```

Remova permanentemente também os dados da célula:

```bash
openclaw fleet rm acme --purge-data --force
```

O Fleet remove o contêiner da célula antes de remover sua rede de bridge dedicada. `--purge-data` exige `--force`. Antes da exclusão recursiva, o Fleet resolve as duas raízes pertencentes ao Fleet e os dois diretórios por locatário. Cada destino deve ser exatamente o diretório folha esperado do locatário, estar estritamente dentro de sua raiz e não ser um link simbólico. Essas verificações de contenção impedem que um caminho de registro corrompido ou um link simbólico entre locatários redirecione a exclusão para outro local.

A limpeza pode ser repetida quando um diretório exato e esperado do locatário já estiver ausente. Isso permite que uma invocação posterior conclua a limpeza após uma falha parcial do sistema de arquivos sem flexibilizar as verificações de caminho para os diretórios que ainda existem.

## Layout de armazenamento e contêineres

O estado da célula e as chaves de criptografia do perfil de autenticação usam caminhos separados por locatário no host, sob o diretório de estado ativo do OpenClaw:

```text
<state-dir>/fleet/cells/<tenant>/
<state-dir>/fleet/auth-profile-secrets/<tenant>/
```

O primeiro diretório é montado em `/home/node/.openclaw`. O segundo é montado em `/home/node/.config/openclaw`, correspondendo à montagem da chave de criptografia da configuração oficial do Docker. Portanto, a chave de criptografia não fica exposta sob a montagem de estado comum nem é incluída quando somente o diretório de estado da célula é incluído em backup ou compartilhado. Ambos os diretórios sobrevivem à remoção e à atualização normais; `fleet rm --purge-data --force` exclui ambos após verificações de contenção separadas.

Antes da primeira inicialização, o Fleet inicializa a configuração da célula com `gateway.mode=local`, autenticação por token, a vinculação do contêiner à LAN e as origens da Control UI para a porta do host alocada. O valor do token não é gravado nessa configuração; ele permanece no ambiente do contêiner.

O Fleet fixa os caminhos do contêiner da imagem oficial com estes valores de ambiente:

| Variável                 | Valor no contêiner                      |
| ------------------------ | ------------------------------------ |
| `HOME`                   | `/home/node`                         |
| `OPENCLAW_HOME`          | `/home/node`                         |
| `OPENCLAW_STATE_DIR`     | `/home/node/.openclaw`               |
| `OPENCLAW_CONFIG_PATH`   | `/home/node/.openclaw/openclaw.json` |
| `OPENCLAW_WORKSPACE_DIR` | `/home/node/.openclaw/workspace`     |
| `OPENCLAW_GATEWAY_TOKEN` | Token da célula gerado ou fornecido     |

Por padrão, a imagem oficial usa o usuário não root `node`, com UID 1000. O Fleet mantém as montagens de vinculação privadas de `0700` graváveis sem torná-las acessíveis a todos. O Docker com root executa a célula com o UID e o GID não root do usuário que fez a invocação; o Docker sem root usa o UID 0 do contêiner, que é mapeado para o usuário não privilegiado do host que fez a invocação dentro do namespace de usuário do daemon. O Podman usa `keep-id` com o UID e o GID do usuário que fez a invocação. Quando o próprio Fleet é executado como root em um runtime com root, ele mantém o usuário da imagem e atribui os arquivos iniciais da montagem ao UID/GID 1000.

Em hosts com SELinux, as montagens do Docker e do Podman recebem uma nova rotulagem privada `:Z`. Se restaurar ou realocar os dados da célula, mantenha os caminhos montados por vinculação graváveis pelo usuário efetivo do contêiner. O perfil é compatível com execução sem root, mas o Docker ou o Podman já deve estar configurado para operação sem root no host; o Fleet não converte um daemon com root em um sem root.

## Perfil de segurança

O Fleet aplica o seguinte perfil a todas as células:

| Controle              | Perfil aplicado                                      | Motivo                                                                                    |
| -------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Recursos do Linux   | `--cap-drop=ALL`                                     | O Gateway é um processo Node.js e não precisa de recursos adicionais do Linux.                |
| Elevação de privilégios | `--security-opt no-new-privileges`                   | Impede que processos obtenham privilégios por meio de binários setuid ou setgid.          |
| Processo init         | `--init`                                             | Coleta processos descendentes e encaminha os sinais de ciclo de vida do contêiner.                   |
| Limite de processos        | `--pids-limit 512` por padrão                        | Limita a criação excessiva de processos e o esgotamento de recursos.                                                    |
| Limite de memória         | `--memory 2g` por padrão                             | Limita o uso de memória da célula.                                                                |
| Limite de CPU            | `--cpus 2` por padrão                                | Limita o uso de CPU da célula.                                                                   |
| Disco da camada gravável  | `--disk` opcional                                    | Limita a camada do contêiner quando o backend de armazenamento do runtime oferece suporte a cotas.           |
| Política de reinicialização       | `--restart unless-stopped`                           | Reinicia uma célula com falha sem substituir uma interrupção intencional.                         |
| Publicação no host      | Somente `127.0.0.1:<host-port>:18789`                   | Mantém o Gateway fora das interfaces curinga do host.                                        |
| Rede da célula         | Uma bridge ou rede interna do Podman por célula       | Separa o tráfego de IP dos contêineres e, opcionalmente, bloqueia a saída do Podman.           |
| Identidade do contêiner   | Mapeamento de usuário correspondente ao host                            | Mantém as montagens de vinculação privadas graváveis sem conceder acesso a todos.                      |
| Estado persistente     | Montagens por célula; nenhuma montagem de estado compartilhada               | Mantém a configuração, as credenciais, as sessões e os espaços de trabalho do locatário na árvore de dados desse locatário. |
| Comando do contêiner    | `node dist/index.js gateway --bind lan --port 18789` | Escuta na rede do contêiner para que o mapeamento de porta do host restrito ao loopback possa alcançá-lo.  |

O Fleet nunca monta `/var/run/docker.sock`, usa `--privileged` ou a rede do host, nem adiciona recursos. A bridge por célula é um limite de separação entre células, não um firewall de saída: as células mantêm a saída de rede necessária para provedores e canais. Coloque diante da porta de loopback um proxy, túnel SSH ou configuração de tailnet que corresponda à sua implantação. `http://127.0.0.1:<port>` só pode ser acessado diretamente pelo host do Fleet.

Esse perfil separa os contêineres dos locatários, mas não protege os locatários contra o operador do Fleet, o administrador do runtime de contêiner ou um host comprometido. Consulte [Hospedagem multilocatário](/pt-BR/gateway/multi-tenant-hosting) para ver o modelo de confiança completo e opções de isolamento mais fortes.

## Tratamento de tokens

Por padrão, `fleet create` gera um token hexadecimal de Gateway com 32 caracteres, criptograficamente aleatório, e o imprime uma única vez no resultado da criação. Armazene-o no gerenciador de segredos aprovado e evite capturar a saída da criação em logs.

`--gateway-token` coloca um token personalizado nos argumentos do processo local, que podem ser mantidos no histórico do shell ou ficar visíveis nas listagens de processos. Prefira o token gerado, a menos que um fluxo de trabalho existente de gerenciamento de segredos exija um valor fornecido.

O token e todos os valores passados com `--env` ficam no ambiente do contêiner. O Fleet os grava em um arquivo de ambiente temporário com modo `0600`, passa somente o caminho desse arquivo ao Docker ou ao Podman e o remove depois que o comando do runtime termina. Os valores digitados explicitamente em `openclaw fleet create --gateway-token ...` ou `--env KEY=VALUE` ainda podem ficar visíveis nos argumentos do processo externo `openclaw` e no histórico do shell.

Os valores de ambiente do contêiner não ficam ocultos para o operador confiável do host: administradores do Docker ou Podman podem lê-los por meio da inspeção do contêiner. A observação "exibido uma vez" do Fleet descreve a saída normal da CLI, não a resistência a um administrador do host.

## Relacionado

- [Hospedagem multilocatário](/pt-BR/gateway/multi-tenant-hosting)
- [Docker](/pt-BR/install/docker)
- [Podman](/pt-BR/install/podman)
- [Segurança do Gateway](/pt-BR/gateway/security)
