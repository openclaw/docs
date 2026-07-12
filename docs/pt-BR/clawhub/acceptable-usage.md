---
read_when:
    - Análise de uploads para detectar abuso ou violações de políticas
    - Redação de documentação de moderação ou guias operacionais para revisores
    - Decidir se uma Skill deve ser ocultada ou se um usuário deve ser banido
sidebarTitle: Acceptable Usage
summary: 'Política do marketplace: o que o ClawHub permite e o que não hospedará.'
title: Uso aceitável
x-i18n:
    generated_at: "2026-07-11T23:46:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso aceitável

O ClawHub hospeda Skills, plugins, pacotes e metadados do marketplace para o OpenClaw.
Use esta página para decidir se determinado conteúdo ou comportamento de publicação pertence ao
ClawHub.

Estas regras se aplicam ao que uma listagem faz, ao que ela solicita que os usuários executem, à forma como
se apresenta e à maneira como os publicadores usam os recursos de descoberta, instalação e
confiança do ClawHub. Para estados de moderação e situação da conta, consulte
[Moderação e segurança da conta](/clawhub/moderation). Para reivindicações de direitos autorais ou outros direitos,
consulte [Solicitações de direitos sobre conteúdo](/clawhub/content-rights).

## Conteúdo permitido

O ClawHub aceita conteúdo útil, compreensível e publicado de
boa-fé.

| Categoria                                         | Permitido quando                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produtividade de desenvolvedores                           | A listagem ajuda os usuários a criar, testar, migrar, depurar, documentar ou operar software.                                               |
| Interfaces de usuário, dados e fluxos de trabalho de automação               | O escopo é claro, as credenciais necessárias são explícitas e as ações de risco incluem opções de revisão, simulação, pré-visualização ou confirmação. |
| Segurança defensiva, moderação e análise de abuso | A ferramenta é apresentada para análise autorizada, preserva evidências e mantém claros os limites de aprovação humana.                          |
| Fluxos de trabalho pessoais ou de equipe                       | O fluxo de trabalho usa contas baseadas em consentimento, configuração transparente e permissões explícitas.                                            |
| Catálogos mantidos                              | Cada listagem é distinta, útil, descrita com precisão e mantida de forma razoável.                                                |

O contexto importa. O mesmo tema pode ser aceitável em um contexto defensivo restrito ou
baseado em consentimento e inaceitável quando apresentado como um fluxo de trabalho para abuso.

## Conteúdo proibido

O ClawHub não hospeda conteúdo cuja finalidade principal seja abuso, fraude, execução
insegura ou violação de direitos.

| Categoria                                                    | Não permitido                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Acesso não autorizado ou contorno de segurança                      | Contorno de autenticação, tomada de conta, abuso de limites de taxa, tomada de chamadas ao vivo ou de agentes, roubo de sessões reutilizáveis ou aprovação automática de fluxos de pareamento para usuários não aprovados.                                                                                                                                                   |
| Abuso de plataforma e evasão de banimento                              | Contas dissimuladas após banimentos, preparação ou cultivo de contas, engajamento falso, automação de múltiplas contas, publicação em massa, bots de spam ou automação criada para evitar detecção.                                                                                                                                          |
| Fraude, golpes e fluxos de trabalho financeiros enganosos             | Certificados ou faturas falsos, fluxos de pagamento enganosos, contato para aplicação de golpes, prova social falsa, fluxos de trabalho com identidades sintéticas para fraude ou ferramentas de gastos/cobranças sem aprovação humana clara.                                                                                                                    |
| Enriquecimento invasivo de privacidade ou vigilância                 | Coleta de contatos para spam, exposição de dados pessoais, perseguição, extração de potenciais clientes combinada com contato não solicitado, monitoramento secreto, correspondência biométrica sem consentimento ou uso de dados vazados ou repositórios de violações de dados.                                                                                                                  |
| Personificação sem consentimento ou manipulação de identidade       | Troca de rostos, gêmeos digitais, influenciadores clonados, personas falsas ou outras ferramentas usadas para personificar ou enganar.                                                                                                                                                                                                 |
| Conteúdo sexual explícito ou geração de conteúdo adulto sem proteções de segurança | Geração de imagens, vídeos ou conteúdo NSFW; interfaces de conteúdo adulto para APIs de terceiros; ou listagens cuja finalidade principal seja conteúdo sexual explícito.                                                                                                                                                       |
| Requisitos de execução ocultos, inseguros ou enganosos        | Comandos de instalação ofuscados, instaladores que encaminham conteúdo para o shell, como conteúdo baixado e executado com `sh` ou `bash` sem possibilidade clara de revisão, requisitos não declarados de segredos ou chaves privadas, execução remota de `npx @latest` sem possibilidade clara de revisão ou metadados que ocultem o que a listagem realmente precisa para ser executada. |
| Material que infringe direitos autorais ou outros direitos           | Republicar Skills, plugins, documentação, ativos de marca ou código proprietário de terceiros sem permissão; violar os termos de licença; ou personificar o autor ou publicador original.                                                                                                                            |

## Comportamento proibido no marketplace

O ClawHub também analisa como os publicadores usam o marketplace. Não use o ClawHub para
manipular a descoberta, as métricas, os sinais de confiança, os sistemas de moderação ou a
atenção dos usuários.

Comportamentos proibidos no marketplace incluem:

- publicar em massa grandes quantidades de listagens de baixo esforço, duplicadas, provisórias ou
  geradas por máquina que não aparentem ter valor real para os usuários
- inundar as áreas de pesquisa ou categorias com Skills ou plugins quase idênticos
- publicar centenas de listagens com pouco ou nenhum uso, manutenção, clareza sobre a origem
  ou diferenciação significativa
- aumentar artificialmente instalações, downloads, estrelas ou outras métricas de
  engajamento por meio de automação, ciclos de auto-instalação, contas falsas, atividade
  coordenada, engajamento pago ou outro comportamento não orgânico
- criar ou alternar contas para evitar moderação, banimentos, limites de publicadores ou
  análise do marketplace
- enganar os usuários sobre propriedade, origem, recursos, postura de segurança,
  requisitos de instalação ou associação com outro projeto ou publicador
- enviar repetidamente conteúdo que já tenha sido ocultado, removido ou bloqueado
  sem corrigir o problema subjacente

A publicação em grande volume não constitui abuso automaticamente. Catálogos grandes são aceitáveis
quando as listagens são significativamente diferentes, descritas com precisão, mantidas
e usadas por usuários reais. Catálogos grandes tornam-se um problema de confiança e segurança quando
o volume está associado a listagens superficiais, duplicadas, enganosas, sem manutenção ou
promovidas artificialmente.

## Direitos sobre conteúdo

Se você acredita que algum conteúdo no ClawHub infringe seus direitos autorais ou outros direitos, use
[Solicitações de direitos sobre conteúdo](/clawhub/content-rights). Não use denúncias normais do marketplace
para reivindicações de direitos autorais ou outros direitos, a menos que a listagem também seja insegura,
maliciosa ou enganosa.

## Análise e aplicação das regras

O ClawHub pode usar verificações automatizadas, sinais estatísticos de abuso, denúncias de usuários e
análise da equipe para identificar conteúdo inseguro ou comportamento abusivo de publicação. Um sinal
por si só não comprova abuso; ele ajuda o ClawHub a decidir o que precisa ser analisado.

Podemos:

- ocultar, reter, remover, excluir de forma reversível ou, quando houver suporte para o tipo de recurso,
  excluir permanentemente listagens que violem as regras
- bloquear downloads ou instalações de versões inseguras
- revogar tokens de API
- excluir de forma reversível conteúdo associado
- restringir o acesso à publicação
- banir infratores reincidentes ou graves

Não garantimos que haverá um aviso antes da aplicação das regras em casos de abuso evidente. Consulte
[Moderação e segurança da conta](/clawhub/moderation) para obter informações sobre denúncias, retenções de moderação,
listagens ocultas, banimentos e situação da conta.
