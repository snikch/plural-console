defmodule Console.Deployments.Pr.Impl.Github do
  import Console.Deployments.Pr.Utils
  alias Console.Schema.{PrAutomation}
  @behaviour Console.Deployments.Pr.Dispatcher

  def create(pr, branch, ctx) do
    with {:ok, client} <- client(pr),
         {:ok, owner, repo} <- identifier(pr),
         {:ok, title, body} <- description(pr, ctx) do
      Tentacat.Pulls.create(client, owner, repo, %{
        head: branch,
        title: title,
        body: body,
        base: pr.branch || "main",
      })
      |> case do
        {_, %{"html_url" => url}, _} -> {:ok, title, url}
        {_, body, _} -> {:error, "failed to create pull request: #{inspect(body)}"}
      end
    end
  end

  defp identifier(%PrAutomation{identifier: id}) when is_binary(id) do
    case String.split(id, "/") do
      [owner, repo] -> {:ok, owner, repo}
      _ -> {:error, "could not parse repo identifier #{id}"}
    end
  end

  defp client(pr) do
    case url_and_token(pr, :pass) do
      {:ok, :pass, token} -> {:ok, Tentacat.Client.new(%{access_token: token})}
      {:ok, url, token} -> {:ok, Tentacat.Client.new(%{access_token: token}, url)}
      err -> err
    end
  end
end
