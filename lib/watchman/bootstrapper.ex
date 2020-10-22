defmodule Watchman.Bootstrapper do
  use GenServer
  require Logger

  defmodule State, do: defstruct [:storage, :ref]

  def start_link(opts \\ :ok) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def init(_) do
    Process.flag(:trap_exit, true)
    if Watchman.conf(:initialize) do
      send self(), :init
    end
    send self(), :cluster
    send self(), :start
    {:ok, %State{storage: determine_storage(), ref: make_ref()}}
  end

  def kick(), do: GenServer.cast(__MODULE__, :start)

  def handle_info(:init, %State{storage: storage} = state) do
    storage.init()
    {:noreply, state}
  end

  def handle_info(:cluster, state) do
    case Watchman.Cluster.start_cluster() do
      :ok -> :ok
      {:error, {:shutdown, {:failed_to_start_child, :deploy, {:already_started, _}}}} -> :ok
    end
    {:noreply, state}
  end

  def handle_info(:start, %State{storage: storage, ref: ref} = state) do
    start_if_not_present(storage, ref)
    {:noreply, state}
  end

  def handle_info(_, state), do: {:noreply, state}

  def handle_cast(:start, %State{storage: storage, ref: ref} = state) do
    start_if_not_present(storage, ref)
    {:noreply, state}
  end

  defp start_if_not_present(storage, me) do
    with :ok <- Watchman.Cluster.lock(me),
         {:ok, pid} = start_deployer(storage),
         :ok <- Watchman.Cluster.save(pid),
         :ok <- Watchman.Cluster.unlock(me),
      do: send self(), :finish
  end

  def terminate(_, _) do
    Logger.info "terminating bootstrapper"
  end

  defp start_deployer(storage), do: Watchman.Deployer.start_link(storage)

  defp determine_storage, do: Watchman.Storage.Git
end