package com.example.maldown

import android.app.Application
import com.example.maldown.data.AppDatabase

class MALDownApplication : Application() {
    
    // Initialize database lazily
    val database: AppDatabase by lazy { 
        AppDatabase.getDatabase(this) 
    }
    
    override fun onCreate() {
        super.onCreate()
        // Initialize any app-wide resources here
    }
}
