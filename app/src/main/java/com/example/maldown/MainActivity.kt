package com.example.maldown

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.example.maldown.data.JikanAnime
import com.example.maldown.data.LibraryEntry
import com.example.maldown.data.LibraryStatus
import com.example.maldown.ui.MainViewModel
import com.example.maldown.ui.theme.MALDownTheme
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState
import com.google.gson.Gson
import kotlinx.coroutines.delay

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MALDownTheme {
                MainScreen()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    viewModel: MainViewModel = viewModel()
) {
    var selectedTab by remember { mutableIntStateOf(0) }
    val homeAnime by viewModel.homeAnime.collectAsState()
    val searchResults by viewModel.searchResults.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    val selectedAnime by viewModel.selectedAnime.collectAsState()
    
    var showDetailsDialog by remember { mutableStateOf(false) }
    var detailsAnime by remember { mutableStateOf<JikanAnime?>(null) }
    
    // Show random anime when selected
    LaunchedEffect(selectedAnime) {
        if (selectedAnime != null) {
            detailsAnime = selectedAnime
            showDetailsDialog = true
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        "MAL Down",
                        fontWeight = FontWeight.Bold
                    ) 
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surfaceContainer
            ) {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Text("🏠", style = MaterialTheme.typography.titleLarge) },
                    label = { Text("Home") }
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Text("🔍", style = MaterialTheme.typography.titleLarge) },
                    label = { Text("Search") }
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Text("📚", style = MaterialTheme.typography.titleLarge) },
                    label = { Text("Library") }
                )
                NavigationBarItem(
                    selected = selectedTab == 3,
                    onClick = { selectedTab = 3 },
                    icon = { Text("👤", style = MaterialTheme.typography.titleLarge) },
                    label = { Text("Profile") }
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Error Snackbar
            error?.let {
                Snackbar(
                    modifier = Modifier
                        .padding(16.dp)
                        .align(Alignment.BottomCenter),
                    action = {
                        TextButton(onClick = { viewModel.clearError() }) {
                            Text("Dismiss")
                        }
                    },
                    containerColor = MaterialTheme.colorScheme.errorContainer,
                    contentColor = MaterialTheme.colorScheme.onErrorContainer
                ) {
                    Text(it)
                }
            }
            
            AnimatedContent(
                targetState = selectedTab,
                transitionSpec = {
                    fadeIn(animationSpec = tween(300)) togetherWith
                            fadeOut(animationSpec = tween(300))
                },
                label = "tab_animation"
            ) { tab ->
                when (tab) {
                    0 -> HomeTab(
                        homeAnime = homeAnime,
                        isLoading = isLoading,
                        viewModel = viewModel,
                        onAnimeClick = { anime ->
                            detailsAnime = anime
                            showDetailsDialog = true
                        }
                    )
                    1 -> SearchTab(
                        searchResults = searchResults,
                        isLoading = isLoading,
                        viewModel = viewModel,
                        onAnimeClick = { anime ->
                            detailsAnime = anime
                            showDetailsDialog = true
                        }
                    )
                    2 -> LibraryTab(
                        viewModel = viewModel,
                        onAnimeClick = { anime ->
                            detailsAnime = anime
                            showDetailsDialog = true
                        }
                    )
                    3 -> ProfileTab(viewModel)
                }
            }
        }
    }
    
    // Anime Details Dialog
    if (showDetailsDialog && detailsAnime != null) {
        AnimeDetailsDialog(
            anime = detailsAnime!!,
            viewModel = viewModel,
            onDismiss = { 
                showDetailsDialog = false
                detailsAnime = null
            }
        )
    }
}

@Composable
fun HomeTab(
    homeAnime: List<JikanAnime>,
    isLoading: Boolean,
    viewModel: MainViewModel,
    onAnimeClick: (JikanAnime) -> Unit
) {
    var selectedMode by remember { mutableStateOf("top") }
    val swipeRefreshState = rememberSwipeRefreshState(isLoading)
    
    Column(modifier = Modifier.fillMaxSize()) {
        // Tab buttons
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            FilterChip(
                selected = selectedMode == "top",
                onClick = { 
                    selectedMode = "top"
                    viewModel.loadTopAnime() 
                },
                label = { Text("🔥 Top Rated") },
                modifier = Modifier.weight(1f)
            )
            FilterChip(
                selected = selectedMode == "seasonal",
                onClick = { 
                    selectedMode = "seasonal"
                    viewModel.loadSeasonalAnime() 
                },
                label = { Text("📅 Seasonal") },
                modifier = Modifier.weight(1f)
            )
        }
        
        SwipeRefresh(
            state = swipeRefreshState,
            onRefresh = {
                when (selectedMode) {
                    "top" -> viewModel.loadTopAnime()
                    "seasonal" -> viewModel.loadSeasonalAnime()
                }
            }
        ) {
            if (homeAnime.isEmpty() && !isLoading) {
                EmptyState(
                    emoji = "🎬",
                    message = "No anime found\nPull to refresh"
                )
            } else {
                AnimeGrid(homeAnime, onAnimeClick)
            }
        }
    }
}

@Composable
fun SearchTab(
    searchResults: List<JikanAnime>,
    isLoading: Boolean,
    viewModel: MainViewModel,
    onAnimeClick: (JikanAnime) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    
    Column(modifier = Modifier.fillMaxSize()) {
        // Search Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier.weight(1f),
                placeholder = { Text("Search anime...") },
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )
            Button(
                onClick = { 
                    if (searchQuery.isNotBlank()) {
                        viewModel.searchAnime(searchQuery)
                    }
                },
                enabled = searchQuery.isNotBlank()
            ) {
                Text("🔍")
            }
        }
        
        Button(
            onClick = { viewModel.getRandomAnime() },
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.secondaryContainer,
                contentColor = MaterialTheme.colorScheme.onSecondaryContainer
            )
        ) {
            Text("🎲 Random Anime")
        }
        
        Spacer(modifier = Modifier.height(8.dp))
        
        if (isLoading) {
            LoadingState()
        } else if (searchResults.isEmpty()) {
            EmptyState(
                emoji = "🔍",
                message = "Search for your\nfavorite anime"
            )
        } else {
            AnimeGrid(searchResults, onAnimeClick)
        }
    }
}

@Composable
fun LibraryTab(
    viewModel: MainViewModel,
    onAnimeClick: (JikanAnime) -> Unit
) {
    val libraryEntries by viewModel.libraryEntries.collectAsState(initial = emptyList())
    val gson = remember { Gson() }
    
    if (libraryEntries.isEmpty()) {
        EmptyState(
            emoji = "📚",
            message = "Your library is empty\nAdd anime from Home or Search!"
        )
    } else {
        LazyVerticalGrid(
            columns = GridCells.Fixed(3),
            contentPadding = PaddingValues(8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(libraryEntries) { entry ->
                val anime = remember(entry) {
                    try {
                        gson.fromJson(entry.animeData, JikanAnime::class.java)
                    } catch (e: Exception) {
                        null
                    }
                }
                
                anime?.let {
                    AnimeCard(
                        anime = it,
                        onClick = { onAnimeClick(it) },
                        showProgress = true,
                        progress = entry.progress,
                        totalEpisodes = entry.totalEpisodes
                    )
                }
            }
        }
    }
}

@Composable
fun ProfileTab(viewModel: MainViewModel) {
    val libraryEntries by viewModel.libraryEntries.collectAsState(initial = emptyList())
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Profile & Statistics",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold
        )
        
        // Statistics Cards
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            StatCard(
                emoji = "📚",
                label = "Total Anime",
                value = libraryEntries.size.toString(),
                modifier = Modifier.weight(1f)
            )
            StatCard(
                emoji = "✅",
                label = "Completed",
                value = libraryEntries.count { it.status == LibraryStatus.COMPLETED }.toString(),
                modifier = Modifier.weight(1f)
            )
        }
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            StatCard(
                emoji = "👀",
                label = "Watching",
                value = libraryEntries.count { it.status == LibraryStatus.WATCHING }.toString(),
                modifier = Modifier.weight(1f)
            )
            StatCard(
                emoji = "📝",
                label = "Plan to Watch",
                value = libraryEntries.count { it.status == LibraryStatus.PLAN_TO_WATCH }.toString(),
                modifier = Modifier.weight(1f)
            )
        }
        
        Divider(modifier = Modifier.padding(vertical = 8.dp))
        
        Text(
            text = "About",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )
        
        InfoCard(
            title = "MAL Down v1.0",
            description = "A beautiful anime tracking app powered by Jikan API"
        )
        
        InfoCard(
            title = "Features",
            description = "• Browse top & seasonal anime\n• Search & discover\n• Track your progress\n• Offline support"
        )
    }
}

@Composable
fun AnimeGrid(
    animeList: List<JikanAnime>,
    onAnimeClick: (JikanAnime) -> Unit
) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(3),
        contentPadding = PaddingValues(8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(animeList) { anime ->
            AnimeCard(
                anime = anime,
                onClick = { onAnimeClick(anime) }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AnimeCard(
    anime: JikanAnime,
    onClick: () -> Unit,
    showProgress: Boolean = false,
    progress: Int = 0,
    totalEpisodes: Int? = null
) {
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(0.7f),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Box {
            AsyncImage(
                model = anime.images.jpg.image_url,
                contentDescription = anime.title,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
            
            // Gradient overlay for better text readability
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                Color.Transparent,
                                Color.Black.copy(alpha = 0.7f)
                            )
                        )
                    )
            )
            
            // Title
            Text(
                text = anime.title,
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(6.dp),
                style = MaterialTheme.typography.bodySmall,
                color = Color.White,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                fontWeight = FontWeight.Bold
            )
            
            // Progress indicator
            if (showProgress && totalEpisodes != null && totalEpisodes > 0) {
                LinearProgressIndicator(
                    progress = { progress.toFloat() / totalEpisodes.toFloat() },
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.TopCenter)
                        .height(3.dp),
                    color = MaterialTheme.colorScheme.primary,
                )
            }
            
            // Score badge
            anime.score?.let { score ->
                Surface(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(6.dp),
                    color = MaterialTheme.colorScheme.primary,
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = "⭐ ${String.format("%.1f", score)}",
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onPrimary,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
fun AnimeDetailsDialog(
    anime: JikanAnime,
    viewModel: MainViewModel,
    onDismiss: () -> Unit
) {
    var selectedStatus by remember { mutableStateOf(LibraryStatus.PLAN_TO_WATCH) }
    var showAddSuccess by remember { mutableStateOf(false) }
    
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .fillMaxHeight(0.9f),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
            ) {
                // Header Image
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(300.dp)
                ) {
                    AsyncImage(
                        model = anime.images.jpg.large_image_url ?: anime.images.jpg.image_url,
                        contentDescription = anime.title,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                    
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.verticalGradient(
                                    colors = listOf(
                                        Color.Transparent,
                                        MaterialTheme.colorScheme.surface
                                    )
                                )
                            )
                    )
                    
                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(8.dp)
                    ) {
                        Surface(
                            color = Color.Black.copy(alpha = 0.5f),
                            shape = RoundedCornerShape(50)
                        ) {
                            Text(
                                "✕",
                                modifier = Modifier.padding(8.dp),
                                color = Color.White,
                                style = MaterialTheme.typography.titleLarge
                            )
                        }
                    }
                }
                
                // Content
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = anime.title,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
                    
                    anime.title_english?.let {
                        Text(
                            text = it,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    
                    // Info chips
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        anime.score?.let {
                            InfoChip("⭐ ${String.format("%.2f", it)}")
                        }
                        anime.episodes?.let {
                            InfoChip("📺 $it eps")
                        }
                        anime.type?.let {
                            InfoChip(it)
                        }
                    }
                    
                    // Genres
                    if (!anime.genres.isNullOrEmpty()) {
                        Text(
                            text = "Genres",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            anime.genres.take(3).forEach { genre ->
                                AssistChip(
                                    onClick = { },
                                    label = { Text(genre.name) }
                                )
                            }
                        }
                    }
                    
                    // Synopsis
                    anime.synopsis?.let {
                        Text(
                            text = "Synopsis",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = it,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    
                    Divider()
                    
                    // Add to Library Section
                    Text(
                        text = "Add to Library",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        LibraryStatus.entries.forEach { status ->
                            FilterChip(
                                selected = selectedStatus == status,
                                onClick = { selectedStatus = status },
                                label = { 
                                    Text(
                                        text = when(status) {
                                            LibraryStatus.WATCHING -> "👀 Watching"
                                            LibraryStatus.COMPLETED -> "✅ Completed"
                                            LibraryStatus.PLAN_TO_WATCH -> "📝 Plan to Watch"
                                            LibraryStatus.DROPPED -> "❌ Dropped"
                                            LibraryStatus.ON_HOLD -> "⏸️ On Hold"
                                        }
                                    )
                                },
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                    
                    Button(
                        onClick = {
                            viewModel.addToLibrary(anime, selectedStatus)
                            showAddSuccess = true
                        },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !showAddSuccess
                    ) {
                        Text(
                            if (showAddSuccess) "✓ Added to Library!" else "Add to Library",
                            modifier = Modifier.padding(vertical = 4.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun InfoChip(text: String) {
    Surface(
        color = MaterialTheme.colorScheme.secondaryContainer,
        shape = RoundedCornerShape(8.dp)
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
fun StatCard(
    emoji: String,
    label: String,
    value: String,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = emoji,
                style = MaterialTheme.typography.headlineMedium
            )
            Text(
                text = value,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f),
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
fun InfoCard(
    title: String,
    description: String
) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun EmptyState(
    emoji: String,
    message: String
) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = emoji,
                style = MaterialTheme.typography.displayLarge
            )
            Text(
                text = message,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
fun LoadingState() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator()
    }
}