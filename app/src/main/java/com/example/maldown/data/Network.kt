package com.example.maldown.data

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

// Jikan API Service
interface JikanApiService {
    
    @GET("anime")
    suspend fun searchAnime(
        @Query("q") query: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 25
    ): JikanAnimeResponse
    
    @GET("top/anime")
    suspend fun getTopAnime(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 25
    ): JikanAnimeResponse
    
    @GET("seasons/now")
    suspend fun getSeasonNow(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 25
    ): JikanAnimeResponse
    
    @GET("schedules")
    suspend fun getSchedule(
        @Query("filter") day: String,
        @Query("page") page: Int = 1
    ): JikanAnimeResponse
    
    @GET("anime/{id}/full")
    suspend fun getAnimeById(
        @Path("id") id: Int
    ): JikanSingleAnimeResponse
    
    @GET("random/anime")
    suspend fun getRandomAnime(): JikanSingleAnimeResponse
    
    @GET("users/{username}/animelist")
    suspend fun getUserAnimeList(
        @Path("username") username: String
    ): JikanAnimeResponse
}

object RetrofitClient {
    private const val BASE_URL = "https://api.jikan.moe/v4/"
    
    val jikanApi: JikanApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(JikanApiService::class.java)
    }
}
