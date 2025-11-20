package com.example.maldown.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.maldown.data.*
import com.google.gson.Gson
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class MainViewModel(application: Application) : AndroidViewModel(application) {
    
    private val database = AppDatabase.getDatabase(application)
    private val libraryDao = database.libraryDao()
    private val jikanApi = RetrofitClient.jikanApi
    private val gson = Gson()
    
    // State Flows
    private val _homeAnime = MutableStateFlow<List<JikanAnime>>(emptyList())
    val homeAnime: StateFlow<List<JikanAnime>> = _homeAnime.asStateFlow()
    
    private val _searchResults = MutableStateFlow<List<JikanAnime>>(emptyList())
    val searchResults: StateFlow<List<JikanAnime>> = _searchResults.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()
    
    private val _selectedAnime = MutableStateFlow<JikanAnime?>(null)
    val selectedAnime: StateFlow<JikanAnime?> = _selectedAnime.asStateFlow()
    
    // Library entries from database
    val libraryEntries: Flow<List<LibraryEntry>> = libraryDao.getAllEntries()
    
    init {
        loadTopAnime()
    }
    
    // Home Data Loading
    fun loadTopAnime(page: Int = 1) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = withContext(Dispatchers.IO) {
                    jikanApi.getTopAnime(page = page)
                }
                if (page == 1) {
                    _homeAnime.value = response.data
                } else {
                    _homeAnime.value = _homeAnime.value + response.data
                }
                _error.value = null
            } catch (e: Exception) {
                _error.value = "Failed to load anime: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun loadSeasonalAnime(page: Int = 1) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = withContext(Dispatchers.IO) {
                    jikanApi.getSeasonNow(page = page)
                }
                if (page == 1) {
                    _homeAnime.value = response.data
                } else {
                    _homeAnime.value = _homeAnime.value + response.data
                }
                _error.value = null
            } catch (e: Exception) {
                _error.value = "Failed to load seasonal anime: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun loadSchedule(day: String, page: Int = 1) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = withContext(Dispatchers.IO) {
                    jikanApi.getSchedule(day = day, page = page)
                }
                _homeAnime.value = response.data
                _error.value = null
            } catch (e: Exception) {
                _error.value = "Failed to load schedule: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    // Search
    fun searchAnime(query: String, page: Int = 1) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = withContext(Dispatchers.IO) {
                    jikanApi.searchAnime(query = query, page = page)
                }
                if (page == 1) {
                    _searchResults.value = response.data
                } else {
                    _searchResults.value = _searchResults.value + response.data
                }
                _error.value = null
            } catch (e: Exception) {
                _error.value = "Search failed: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun getRandomAnime() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = withContext(Dispatchers.IO) {
                    jikanApi.getRandomAnime()
                }
                _selectedAnime.value = response.data
                _error.value = null
            } catch (e: Exception) {
                _error.value = "Failed to get random anime: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    // Library Management
    fun addToLibrary(
        anime: JikanAnime,
        status: LibraryStatus = LibraryStatus.PLAN_TO_WATCH,
        progress: Int = 0,
        score: Int = 0
    ) {
        viewModelScope.launch {
            try {
                val entry = LibraryEntry(
                    id = anime.mal_id,
                    animeData = gson.toJson(anime),
                    status = status,
                    progress = progress,
                    totalEpisodes = anime.episodes,
                    score = score,
                    dateAdded = System.currentTimeMillis(),
                    startDate = null,
                    finishDate = null,
                    priority = "Medium",
                    rewatching = false,
                    rewatchCount = 0,
                    tags = gson.toJson(emptyList<String>()),
                    notes = ""
                )
                libraryDao.insertEntry(entry)
            } catch (e: Exception) {
                _error.value = "Failed to add to library: ${e.message}"
            }
        }
    }
    
    fun updateLibraryEntry(entry: LibraryEntry) {
        viewModelScope.launch {
            try {
                libraryDao.updateEntry(entry)
            } catch (e: Exception) {
                _error.value = "Failed to update entry: ${e.message}"
            }
        }
    }
    
    fun deleteFromLibrary(id: Int) {
        viewModelScope.launch {
            try {
                libraryDao.deleteEntryById(id)
            } catch (e: Exception) {
                _error.value = "Failed to delete entry: ${e.message}"
            }
        }
    }
    
    fun updateProgress(id: Int, progress: Int) {
        viewModelScope.launch {
            try {
                libraryDao.updateProgress(id, progress)
            } catch (e: Exception) {
                _error.value = "Failed to update progress: ${e.message}"
            }
        }
    }
    
    fun isAnimeInLibrary(animeId: Int): Flow<Boolean> = flow {
        val entry = libraryDao.getEntryById(animeId)
        emit(entry != null)
    }
    
    fun clearError() {
        _error.value = null
    }
}
