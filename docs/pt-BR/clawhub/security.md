---
read_when:
    - Entendendo os resultados de varredura e moderação do ClawHub
    - Relatar uma habilidade ou pacote
    - Recuperação de uma listagem retida, oculta ou bloqueada
summary: Comportamento de confiança, verificação, denúncias e moderação do ClawHub.
x-i18n:
    generated_at: "2026-05-12T08:44:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Segurança + Moderação

ClawHub é aberto para publicação, mas as listagens públicas ainda passam por controles de confiança,
varredura, denúncia e moderação. O objetivo é prático: ajudar os usuários
a inspecionar o que instalam, dar aos publicadores um caminho de recuperação para falsos positivos
e manter pacotes abusivos fora da descoberta pública.

Veja também [Uso aceitável](/pt-BR/clawhub/acceptable-usage).

## O que os usuários podem inspecionar

Antes de instalar uma skill ou plugin, verifique a listagem dela no ClawHub para:

- atribuição de proprietário e origem
- versão mais recente e changelog
- variáveis de ambiente ou permissões obrigatórias
- metadados de compatibilidade para plugins
- status de varredura ou moderação
- denúncias, comentários, estrelas, downloads e sinais de instalação quando exibidos

Instale apenas conteúdo que você entende e confia.

## Estados de varredura

ClawHub pode mostrar resultados de varredura ou moderação em páginas públicas e diagnósticos
visíveis ao proprietário.

Resultados comuns incluem:

- `clean`: nenhum problema bloqueante foi encontrado.
- `suspicious`: a versão exige cautela ou revisão.
- `malicious`: a versão é considerada insegura.
- `pending`: as verificações ainda não foram concluídas.
- `held`, `quarantined`, `revoked` ou `hidden`: a versão não está totalmente
  disponível nas superfícies públicas de instalação.

A redação exata pode variar conforme a superfície, mas o significado prático é o mesmo: se uma
versão estiver retida ou bloqueada, os usuários não devem instalá-la até que o proprietário resolva
o problema ou a moderação a restaure.

## Skills

As varreduras de Skills analisam o pacote de skill publicado, os metadados, os requisitos
declarados e instruções suspeitas.

ClawHub presta atenção especial a incompatibilidades entre o que uma skill declara e
o que ela parece fazer. Por exemplo, uma skill que referencia uma chave de API obrigatória
deve declarar esse requisito em `SKILL.md` para que os usuários possam vê-lo antes de
instalar.

As constatações de varredura são baseadas em artefatos. Comportamento esperado do provedor, como
credenciais de API declaradas, callbacks OAuth localhost, limpeza de desinstalação escopada, codificação de Basic Auth
ou uploads de arquivos selecionados pelo usuário para o provedor declarado, é tratado
de forma diferente de encaminhamento oculto de credenciais, acesso amplo a arquivos privados,
destinos de rede não relacionados ou abuso furtivo de navegador.

Veja [Formato de skill](/pt-BR/clawhub/skill-format).

## Plugins

Versões de Plugin incluem metadados do pacote, atribuição de origem, campos de compatibilidade
e informações de integridade do artefato.

OpenClaw verifica a compatibilidade antes de instalar plugins hospedados no ClawHub. Registros de pacote
também podem expor metadados de digest para que o OpenClaw possa verificar artefatos
baixados. ClawScan inclui metadados declarados de env/config `openclaw.environment` do pacote
ao revisar versões de plugin, para que os requisitos declarados de runtime sejam
comparados com o comportamento observado.

## Denúncias

Usuários autenticados podem denunciar skills, pacotes e comentários.

As denúncias devem ser específicas e acionáveis. O abuso das denúncias pode, por si só, levar a
ações na conta.

Exemplos de denúncia:

- metadados enganosos
- requisitos de credenciais ou permissões não declarados
- instruções de instalação suspeitas
- comentários fraudulentos ou falsificação de identidade
- registros de má-fé ou uso indevido de marca registrada
- conteúdo que viola [Uso aceitável](/pt-BR/clawhub/acceptable-usage)

## Observações do ClawScan para publicadores

Publicadores podem fornecer uma observação opcional do ClawScan ao publicar uma skill ou
plugin. Essa observação dá ao ClawScan contexto sobre comportamentos que, de outra forma, poderiam parecer
incomuns, como acesso à rede, acesso a host nativo ou credenciais
específicas de provedor.

## Retenções de moderação

Quando o scanner estático sinaliza uma skill enviada como maliciosa, o publicador é
automaticamente colocado sob retenção de moderação (`requiresModerationAt` definido no
usuário). Isso oculta todas as skills do publicador, faz com que publicações futuras
comecem ocultas e cria uma entrada de log de auditoria `user.moderation.auto`.

Constatações estáticas suspeitas são mantidas como evidência de arquivo/linha para moderadores,
mas não ocultam conteúdo nem decidem o veredito público de varredura por conta própria.
Novos envios permanecem em estado de revisão/pendente até que a revisão por LLM seja concluída. A varredura
estática só bloqueia imediatamente para assinaturas maliciosas. Detecções de engine do VirusTotal
permanecem como evidência de segurança visível, mas vereditos do VirusTotal Code Insight/Palm
são consultivos e não ocultam skills por conta própria. Revisões LLM do ClawScan
mantêm observações alinhadas ao propósito como orientação. Constatações de revisão médias permanecem visíveis no
artefato, enquanto o filtro suspeito é reservado para preocupações LLM de alto impacto,
constatações maliciosas ou detecções corroboradas por engines de AV.

Administradores podem remover uma retenção de falso positivo:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Isso limpa `requiresModerationAt` e `requiresModerationReason`, restaura
skills ocultas pela retenção em nível de usuário e grava uma entrada de log de auditoria
`user.moderation.lift`. Skills ocultas por outros motivos, ou cuja própria varredura estática permanece
maliciosa, continuam ocultas.

## Banimentos e situação da conta

Contas que violam a política do ClawHub podem perder acesso à publicação. Abusos graves
podem resultar em banimentos de conta, revogação de tokens, conteúdo oculto ou listagens
removidas.

Contas excluídas, banidas ou desativadas não podem usar tokens de API do ClawHub. Se a autenticação da CLI
começar a falhar após uma ação na conta, entre na interface web para revisar o
estado da conta. Se o login ou o acesso normal pela CLI estiver bloqueado, entre em contato com
security@openclaw.ai para análise de recuperação.

## Orientação para publicadores

Para reduzir falsos positivos e melhorar a confiança dos usuários:

- mantenha nomes, resumos, tags e changelogs precisos
- declare variáveis de ambiente e permissões obrigatórias
- adicione uma observação do ClawScan para publicador quando uma versão tiver comportamento incomum, mas intencional
- evite comandos de instalação ofuscados
- vincule ao código-fonte quando possível
- use execuções simuladas antes de publicar plugins
- responda com clareza se usuários ou moderadores perguntarem sobre o comportamento do pacote
